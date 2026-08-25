import { File } from "expo-file-system";
import { apiUpload } from "./client";

// Expo's fetch polyfill (installed globally in SDK 57+) only accepts real
// Blob-like parts in FormData - React Native's classic {uri, name, type}
// shape throws "Unsupported FormDataPart implementation" at request time.
// expo-file-system's File implements the Blob interface (.bytes()) and
// auto-detects the mime type natively, so it works with both.
export function uploadImage(uri: string) {
  const file = new File(uri);

  const formData = new FormData();
  formData.append("image", file as unknown as Blob);

  return apiUpload<{ url: string }>("/api/uploads/image", formData).then((r) => r.data);
}
