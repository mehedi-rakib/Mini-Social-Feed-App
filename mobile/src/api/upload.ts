import { apiUpload } from "./client";

export function uploadImage(uri: string, mimeType?: string) {
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const type = mimeType ?? guessMimeType(filename);

  const formData = new FormData();
  // React Native's FormData accepts this {uri, name, type} shape in place of
  // a real Blob/File for local file uris.
  formData.append("image", { uri, name: filename, type } as unknown as Blob);

  return apiUpload<{ url: string }>("/api/uploads/image", formData).then((r) => r.data);
}

// Fallback for callers that don't have the picker's own mimeType (e.g. it
// wasn't reported) - content:// uris on Android often have no extension, so
// this can't do better than guess jpeg in that case.
function guessMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
}
