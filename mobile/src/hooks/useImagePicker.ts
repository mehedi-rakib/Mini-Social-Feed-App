import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "@/api/upload";

export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImageUri(null);
  }, []);

  // Shared by every screen that attaches an optional image to a post/message:
  // uploads the picked image (if any) and returns its server URL, toggling
  // isUploading around the request so callers don't each reimplement that.
  const uploadIfPresent = useCallback(async (): Promise<string | undefined> => {
    if (!imageUri) return undefined;
    setIsUploading(true);
    try {
      const { url } = await uploadImage(imageUri);
      return url;
    } finally {
      setIsUploading(false);
    }
  }, [imageUri]);

  return { imageUri, pickImage, clearImage, isUploading, uploadIfPresent };
}
