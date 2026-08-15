import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { AddCommentInput, ListCommentsQuery } from "./comments.schema.js";

export interface PublicComment {
  id: string;
  content: string;
  user: { id: string; username: string };
  createdAt: string;
}

function serialize(c: { id: string; content: string; createdAt: Date; user: { id: string; username: string } }): PublicComment {
  return {
    id: c.id,
    content: c.content,
    user: { id: c.user.id, username: c.user.username },
    createdAt: c.createdAt.toISOString(),
  };
}

export async function addComment(
  postId: string,
  userId: string,
  input: AddCommentInput
): Promise<{ comment: PublicComment; postAuthorId: string }> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError("NOT_FOUND", "Post not found");
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: { content: input.content, postId, userId },
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);

  return { comment: serialize(comment), postAuthorId: post.authorId };
}

export async function listComments(postId: string, query: ListCommentsQuery) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: { user: { select: { id: true, username: true } } },
  });

  const hasMore = comments.length > query.limit;
  const page = hasMore ? comments.slice(0, query.limit) : comments;

  return {
    data: page.map(serialize),
    meta: { nextCursor: hasMore ? page[page.length - 1].id : null, hasMore },
  };
}
