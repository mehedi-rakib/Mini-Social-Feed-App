import type { Post } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreatePostInput, ListPostsQuery } from "./posts.schema.js";

export interface PublicPost {
  id: string;
  content: string;
  author: { id: string; username: string };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

type PostWithAuthor = Post & { author: { id: string; username: string } };

function serializePost(post: PostWithAuthor, likedByMe: boolean): PublicPost {
  return {
    id: post.id,
    content: post.content,
    author: { id: post.author.id, username: post.author.username },
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe,
    createdAt: post.createdAt.toISOString(),
  };
}

export async function createPost(authorId: string, input: CreatePostInput): Promise<PublicPost> {
  const post = await prisma.post.create({
    data: { content: input.content, authorId },
    include: { author: { select: { id: true, username: true } } },
  });

  return serializePost(post, false);
}

export async function listPosts(userId: string, query: ListPostsQuery) {
  const posts = await prisma.post.findMany({
    where: query.username ? { author: { usernameLower: query.username.toLowerCase() } } : undefined,
    orderBy: { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { author: { select: { id: true, username: true } } },
  });

  const hasMore = posts.length > query.limit;
  const page = hasMore ? posts.slice(0, query.limit) : posts;

  const likedSet = await resolveLikedByMe(
    userId,
    page.map((p) => p.id)
  );

  const data = page.map((p) => serializePost(p, likedSet.has(p.id)));

  return {
    data,
    meta: { nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
  };
}

export async function getPost(postId: string, userId: string): Promise<PublicPost> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { id: true, username: true } } },
  });

  if (!post) {
    throw new ApiError("NOT_FOUND", "Post not found");
  }

  const likedSet = await resolveLikedByMe(userId, [postId]);
  return serializePost(post, likedSet.has(postId));
}

async function resolveLikedByMe(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();

  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });

  return new Set(likes.map((l) => l.postId));
}
