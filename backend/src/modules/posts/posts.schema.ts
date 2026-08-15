import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().trim().min(1, "Content cannot be empty").max(500),
});

export const listPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  cursor: z.string().optional(),
  username: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
