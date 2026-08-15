import { prisma } from "../../lib/prisma.js";
import { messaging } from "../../lib/messaging.js";

type NotificationType = "like" | "comment";

interface NotifyInput {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  type: NotificationType;
  postId: string;
  postPreview?: string;
}

function buildMessage(input: NotifyInput): { title: string; body: string } {
  if (input.type === "like") {
    return { title: "New like", body: `${input.actorUsername} liked your post` };
  }
  const preview = (input.postPreview ?? "").slice(0, 60);
  return { title: "New comment", body: `${input.actorUsername} commented: ${preview}` };
}

export async function notify(input: NotifyInput): Promise<void> {
  if (input.recipientId === input.actorId) {
    return;
  }

  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: { fcmTokens: true },
  });
  const tokens = (recipient?.fcmTokens as string[] | null) ?? [];

  if (tokens.length === 0) {
    return;
  }

  const { title, body } = buildMessage(input);

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { type: input.type, postId: input.postId },
    android: { priority: "high" },
  });

  const staleTokens: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
      staleTokens.push(tokens[i]);
    }
  });

  if (staleTokens.length > 0) {
    const remaining = tokens.filter((t) => !staleTokens.includes(t));
    await prisma.user.update({ where: { id: input.recipientId }, data: { fcmTokens: remaining } });
  }
}
