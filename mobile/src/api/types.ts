export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  author: { id: string; username: string };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  user: { id: string; username: string };
  createdAt: string;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Conversation {
  id: string;
  otherUser: { id: string; username: string };
  lastMessagePreview: string | null;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: { id: string; username: string };
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
}
