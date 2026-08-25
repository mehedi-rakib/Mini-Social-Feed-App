import { prisma } from "../../lib/prisma.js";
import { messaging } from "../../lib/messaging.js";

type NotificationType = "like" | "comment" | "message";

interface NotifyInput {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  type: NotificationType;
  postId?: string;
  postPreview?: string;
  conversationId?: string;
  messagePreview?: string;
}

function buildMessage(input: NotifyInput): { title: string; body: string } {
  if (input.type === "like") {
    return { title: "New like", body: `${input.actorUsername} liked your post` };
  }
  if (input.type === "comment") {
    const preview = (input.postPreview ?? "").slice(0, 60);
    return { title: "New comment", body: `${input.actorUsername} commented: ${preview}` };
  }
  const preview = input.messagePreview ? input.messagePreview.slice(0, 60) : "Sent a photo";
  return { title: "New message", body: `${input.actorUsername}: ${preview}` };
}

export async function notify(input: NotifyInput): Promise<void> {
  if (input.recipientId === input.actorId) {
    return;
  }

  const devices = await prisma.device.findMany({
    where: { userId: input.recipientId },
    select: { token: true },
  });
  const tokens = devices.map((d) => d.token);

  if (tokens.length === 0) {
    return;
  }

  const { title, body } = buildMessage(input);

  const data: Record<string, string> = { type: input.type };
  if (input.postId) data.postId = input.postId;
  if (input.conversationId) data.conversationId = input.conversationId;

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    android: { priority: "high", notification: { channelId: "default" } },
  });

  const staleTokens: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
      staleTokens.push(tokens[i]);
    }
  });

  if (staleTokens.length > 0) {
    await prisma.device.deleteMany({ where: { token: { in: staleTokens } } });
  }
}
