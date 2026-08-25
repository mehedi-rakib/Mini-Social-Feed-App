import { prisma } from "../../lib/prisma.js";

export async function registerDevice(userId: string, token: string, platform: string): Promise<void> {
  // `token` is globally unique, not scoped per-user - upserting on it means a
  // device that logs into a different account gets its token reassigned
  // instead of leaking notifications to whichever account registered it
  // first.
  await prisma.device.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform, lastSeenAt: new Date() },
  });
}

export async function unregisterDevice(userId: string, token: string): Promise<void> {
  await prisma.device.deleteMany({ where: { token, userId } });
}
