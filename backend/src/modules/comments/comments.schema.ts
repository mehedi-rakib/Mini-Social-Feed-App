import { z } from "zod";

export const addCommentSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty").max(1000),
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
