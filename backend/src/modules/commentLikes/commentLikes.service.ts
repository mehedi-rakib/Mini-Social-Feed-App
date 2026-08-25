import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export interface ToggleCommentLikeResult {
  liked: boolean;
  likeCount: number;
  commentAuthorId: string;
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<ToggleCommentLikeResult> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new ApiError("NOT_FOUND", "Comment not found");
  }

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  const liked = !existing;

  const updated = await prisma.$transaction(async (tx) => {
    if (liked) {
      await tx.commentLike.create({ data: { commentId, userId } });
      return tx.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } });
    }
    await tx.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
    return tx.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } });
  });

  return { liked, likeCount: updated.likeCount, commentAuthorId: comment.userId };
}
