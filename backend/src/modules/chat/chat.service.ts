import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { SendMessageInput, ListMessagesQuery } from "./chat.schema.js";

type Participant = { id: string; username: string };

export interface PublicConversation {
  id: string;
  otherUser: Participant;
  lastMessagePreview: string | null;
  lastMessageAt: string;
}

export interface PublicMessage {
  id: string;
  conversationId: string;
  sender: Participant;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
}

type ConversationWithParticipants = {
  id: string;
  userAId: string;
  userBId: string;
  userA: Participant;
  userB: Participant;
  lastMessagePreview: string | null;
  lastMessageAt: Date;
};

function serializeConversation(conversation: ConversationWithParticipants, userId: string): PublicConversation {
  const otherUser = conversation.userAId === userId ? conversation.userB : conversation.userA;
  return {
    id: conversation.id,
    otherUser,
    lastMessagePreview: conversation.lastMessagePreview,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
  };
}

function serializeMessage(m: {
  id: string;
  conversationId: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: Date;
  sender: Participant;
}): PublicMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    sender: m.sender,
    content: m.content,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt.toISOString(),
  };
}

const participantInclude = {
  userA: { select: { id: true, username: true } },
  userB: { select: { id: true, username: true } },
} as const;

export async function listConversations(userId: string): Promise<PublicConversation[]> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: participantInclude,
  });

  return conversations.map((c) => serializeConversation(c, userId));
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string
): Promise<{ conversation: PublicConversation; created: boolean }> {
  if (userId === otherUserId) {
    throw new ApiError("VALIDATION_ERROR", "You can't start a conversation with yourself");
  }

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) {
    throw new ApiError("NOT_FOUND", "User not found");
  }

  const [userAId, userBId] = [userId, otherUserId].sort();

  const existing = await prisma.conversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    include: participantInclude,
  });
  if (existing) {
    return { conversation: serializeConversation(existing, userId), created: false };
  }

  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
    include: participantInclude,
  });

  return { conversation: serializeConversation(conversation, userId), created: true };
}

async function requireParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) {
    throw new ApiError("NOT_FOUND", "Conversation not found");
  }
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new ApiError("FORBIDDEN", "You're not part of this conversation");
  }
  return conversation;
}

export async function getConversation(conversationId: string, userId: string): Promise<PublicConversation> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: participantInclude,
  });
  if (!conversation) {
    throw new ApiError("NOT_FOUND", "Conversation not found");
  }
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new ApiError("FORBIDDEN", "You're not part of this conversation");
  }

  return serializeConversation(conversation, userId);
}

export async function listMessages(conversationId: string, userId: string, query: ListMessagesQuery) {
  await requireParticipant(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, username: true } } },
  });

  const hasMore = messages.length > query.limit;
  const page = hasMore ? messages.slice(0, query.limit) : messages;

  return {
    data: page.map(serializeMessage),
    meta: { nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
  };
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  input: SendMessageInput
): Promise<{ message: PublicMessage; recipientId: string }> {
  const conversation = await requireParticipant(conversationId, userId);
  const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;
  const preview = (input.content ?? "📷 Photo").slice(0, 120);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: userId, content: input.content, imageUrl: input.imageUrl },
      include: { sender: { select: { id: true, username: true } } },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessagePreview: preview, lastMessageAt: new Date() },
    }),
  ]);

  return { message: serializeMessage(message), recipientId };
}
