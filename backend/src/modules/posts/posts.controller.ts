import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/response.js";
import * as postsService from "./posts.service.js";
import type { CreatePostInput, ListPostsQuery } from "./posts.schema.js";

export const createPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.createPost(req.user!.id, req.body as CreatePostInput);
  ok(res, post, undefined, 201);
});

export const listPostsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { data, meta } = await postsService.listPosts(req.user!.id, req.validatedQuery as ListPostsQuery);
  ok(res, data, meta);
});

export const getPostHandler = asyncHandler(async (req: Request, res: Response) => {
  const post = await postsService.getPost(req.params.id as string, req.user!.id);
  ok(res, post);
});
