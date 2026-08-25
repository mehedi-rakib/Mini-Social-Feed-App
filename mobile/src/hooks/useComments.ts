import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as postsApi from "@/api/posts";
import type { Comment, PageMeta } from "@/api/types";

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => postsApi.listComments(postId, { limit: 50 }),
    enabled: !!postId,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postsApi.addComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

interface CommentsData {
  data: Comment[];
  meta: PageMeta;
}

function toggled(comment: Comment): Comment {
  return { ...comment, likedByMe: !comment.likedByMe, likeCount: comment.likeCount + (comment.likedByMe ? -1 : 1) };
}

export function useToggleCommentLike(postId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["comments", postId];

  return useMutation({
    mutationFn: (commentId: string) => postsApi.toggleCommentLike(postId, commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentsData>(queryKey);

      queryClient.setQueryData<CommentsData | undefined>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, data: old.data.map((c) => (c.id === commentId ? toggled(c) : c)) };
      });

      return { previous };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
  });
}
