import { apiRequest } from "./client";
import type { Comment, PageMeta, Post } from "./types";

export function listPosts(params: { limit?: number; cursor?: string }) {
  return apiRequest<Post[]>("/api/posts", { query: params }).then((r) => ({
    data: r.data,
    meta: r.meta as PageMeta,
  }));
}

export function getPost(id: string) {
  return apiRequest<Post>(`/api/posts/${id}`).then((r) => r.data);
}

export function createPost(content: string, imageUrl?: string) {
  return apiRequest<Post>("/api/posts", { method: "POST", body: { content, imageUrl } }).then((r) => r.data);
}

export function toggleLike(postId: string) {
  return apiRequest<{ liked: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
    method: "POST",
  }).then((r) => r.data);
}

export function addComment(postId: string, content: string) {
  return apiRequest<Comment>(`/api/posts/${postId}/comment`, { method: "POST", body: { content } }).then(
    (r) => r.data
  );
}

export function listComments(postId: string, params: { limit?: number; cursor?: string }) {
  return apiRequest<Comment[]>(`/api/posts/${postId}/comments`, { query: params }).then((r) => ({
    data: r.data,
    meta: r.meta as PageMeta,
  }));
}
