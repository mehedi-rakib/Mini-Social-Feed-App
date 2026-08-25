import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import * as chatService from "./chat.service.js";
import { notify } from "../notifications/notification.service.js";
import type { StartConversationInput, SendMessageInput, ListMessagesQuery } from "./chat.schema.js";

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await chatService.listConversations(req.user!.id);
  ok(res, data);
});

export const startConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body as StartConversationInput;
  const { conversation, created } = await chatService.getOrCreateConversation(req.user!.id, userId);
  ok(res, conversation, undefined, created ? 201 : 200);
});

export const getConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await chatService.getConversation(req.params.id as string, req.user!.id);
  ok(res, conversation);
});

export const listMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await chatService.listMessages(
    req.params.id as string,
    req.user!.id,
    req.validatedQuery as ListMessagesQuery
  );
  ok(res, data, meta);
});

export const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversationId = req.params.id as string;
  const { message, recipientId } = await chatService.sendMessage(
    conversationId,
    req.user!.id,
    req.body as SendMessageInput
  );

  ok(res, message, undefined, 201);

  notify({
    recipientId,
    actorId: req.user!.id,
    actorUsername: req.user!.username,
    type: "message",
    conversationId,
    messagePreview: message.content ?? undefined,
  }).catch((err) => console.error("notify failed:", err));
});
