import { apiRequest } from "./client";
import type { Conversation, Message, PageMeta } from "./types";

export function listConversations() {
  return apiRequest<Conversation[]>("/api/conversations").then((r) => r.data);
}

export function startConversation(userId: string) {
  return apiRequest<Conversation>("/api/conversations", { method: "POST", body: { userId } }).then((r) => r.data);
}

export function getConversation(conversationId: string) {
  return apiRequest<Conversation>(`/api/conversations/${conversationId}`).then((r) => r.data);
}

export function listMessages(conversationId: string, params: { limit?: number; cursor?: string }) {
  return apiRequest<Message[]>(`/api/conversations/${conversationId}/messages`, { query: params }).then((r) => ({
    data: r.data,
    meta: r.meta as PageMeta,
  }));
}

export function sendMessage(conversationId: string, body: { content?: string; imageUrl?: string }) {
  return apiRequest<Message>(`/api/conversations/${conversationId}/messages`, { method: "POST", body }).then(
    (r) => r.data
  );
}
