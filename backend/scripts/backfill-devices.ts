// One-off migration helper: copies push tokens out of the legacy
// `users.fcmTokens` JSON column into the new `devices` table. Run this after
// the migration that creates `devices` but before the migration that drops
// `fcmTokens` - see backend/README.md for the exact deploy order.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface LegacyUserRow {
  id: string;
  fcmTokens: unknown;
}

function parseTokens(value: unknown): string[] {
  if (!value) return [];
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string" && t.length > 0) : [];
}

async function main() {
  const rows = await prisma.$queryRaw<LegacyUserRow[]>`SELECT id, fcmTokens FROM users`;

  let migrated = 0;
  for (const row of rows) {
    for (const token of parseTokens(row.fcmTokens)) {
      await prisma.device.upsert({
        where: { token },
        create: { userId: row.id, token, platform: "ANDROID" },
        update: { userId: row.id, platform: "ANDROID" },
      });
      migrated++;
    }
  }

  console.log(`Backfilled ${migrated} device row(s) from ${rows.length} user row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
