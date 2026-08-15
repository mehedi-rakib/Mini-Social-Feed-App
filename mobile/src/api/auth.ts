import { apiRequest } from "./client";
import type { AuthResponse, PublicUser } from "./types";

export function signup(input: { username: string; email: string; password: string; displayName?: string }) {
  return apiRequest<AuthResponse>("/api/auth/signup", { method: "POST", body: input }).then((r) => r.data);
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: input }).then((r) => r.data);
}

export function me() {
  return apiRequest<PublicUser>("/api/auth/me").then((r) => r.data);
}
