import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype] ?? ""}`);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new Error("Only JPEG, PNG, or WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function imageUrlForFilename(filename: string): string {
  return `/uploads/${filename}`;
}

// multer's fileFilter only sees the client-declared Content-Type, which is
// trivial to spoof - this checks the file's actual magic bytes on disk
// against the extension multer already picked, so a renamed non-image can't
// ride the declared mimetype past the filter and get served back as one.
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  ".jpg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  ".png": (buf) =>
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a,
  ".webp": (buf) =>
    buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP",
};

export async function verifyImageSignature(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath);
  const check = MAGIC_BYTES[ext];
  if (!check) return false;

  const handle = await fs.promises.open(filePath, "r");
  try {
    const buf = Buffer.alloc(12);
    await handle.read(buf, 0, 12, 0);
    return check(buf);
  } finally {
    await handle.close();
  }
}

// Posts/messages only ever attach an imageUrl by round-tripping through
// POST /api/uploads/image first - this rejects anything else (e.g. an
// external URL submitted directly) instead of trusting whatever the client
// sends.
export function isOwnUploadUrl(value: string): boolean {
  return /^\/uploads\/[A-Za-z0-9-]+\.(jpg|png|webp)$/.test(value);
}
