import Constants from "expo-constants";

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "";

if (!API_URL) {
  console.warn("No apiUrl configured in app.config.ts extra - API calls will fail.");
}

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: unknown;
  error?: { code: string; message: string; details?: unknown };
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: unknown }> {
  const url = new URL(path, API_URL);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let json: Envelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiClientError(res.status, "INTERNAL", "Server returned an invalid response");
  }

  if (!json.success) {
    const code = json.error?.code ?? "INTERNAL";
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiClientError(res.status, code, json.error?.message ?? "Request failed", json.error?.details);
  }

  return { data: json.data as T, meta: json.meta };
}
