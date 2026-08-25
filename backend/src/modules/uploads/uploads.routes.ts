import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { imageUpload } from "../../lib/upload.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadImageHandler } from "./uploads.controller.js";

const router = Router();

// multer reports errors (bad mime type, oversized file) via a callback
// rather than a thrown error, so it has to be adapted into an ApiError by
// hand instead of just being dropped in as regular middleware.
function parseImage(req: Request, res: Response, next: NextFunction) {
  imageUpload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5MB or smaller" : err.message;
      return next(new ApiError("VALIDATION_ERROR", message));
    }
    if (err instanceof Error) {
      return next(new ApiError("VALIDATION_ERROR", err.message));
    }
    next();
  });
}

router.use(requireAuth);

router.post("/image", writeLimiter, parseImage, uploadImageHandler);

export default router;
