import { z } from "zod";
import { isOwnUploadUrl } from "../../lib/upload.js";

export const startConversationSchema = z.object({
  userId: z.string().min(1),
});

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(2000).optional(),
    imageUrl: z.string().refine(isOwnUploadUrl, "imageUrl must come from POST /api/uploads/image").optional(),
  })
  .refine((data) => Boolean(data.content) || Boolean(data.imageUrl), {
    message: "Message must include content or an image",
  });

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  cursor: z.string().optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
