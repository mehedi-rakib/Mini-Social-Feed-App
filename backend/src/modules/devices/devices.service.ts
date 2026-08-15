import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

async function getTokens(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmTokens: true } });
  if (!user) {
    throw new ApiError("NOT_FOUND", "User not found");
  }
  return (user.fcmTokens as string[] | null) ?? [];
}

export async function registerDevice(userId: string, token: string): Promise<void> {
  const tokens = await getTokens(userId);
  if (tokens.includes(token)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { fcmTokens: [...tokens, token] },
  });
}

export async function unregisterDevice(userId: string, token: string): Promise<void> {
  const tokens = await getTokens(userId);
  const next = tokens.filter((t) => t !== token);
  if (next.length === tokens.length) return;

  await prisma.user.update({
    where: { id: userId },
    data: { fcmTokens: next },
  });
}
