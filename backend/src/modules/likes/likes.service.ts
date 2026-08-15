import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
  postAuthorId: string;
}

export async function toggleLike(postId: string, userId: string): Promise<ToggleLikeResult> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError("NOT_FOUND", "Post not found");
  }

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  const liked = !existing;

  const updated = await prisma.$transaction(async (tx) => {
    if (liked) {
      await tx.like.create({ data: { postId, userId } });
      return tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
    }
    await tx.like.delete({ where: { postId_userId: { postId, userId } } });
    return tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
  });

  return { liked, likeCount: updated.likeCount, postAuthorId: post.authorId };
}
