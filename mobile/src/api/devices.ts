import { apiRequest } from "./client";

export function registerDevice(token: string, platform: string) {
  return apiRequest<{ registered: boolean }>("/api/devices", {
    method: "POST",
    body: { token, platform },
  }).then((r) => r.data);
}

export function unregisterDevice(token: string) {
  return apiRequest<{ registered: boolean }>("/api/devices", { method: "DELETE", body: { token } }).then(
    (r) => r.data
  );
}
