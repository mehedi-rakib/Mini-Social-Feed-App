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
