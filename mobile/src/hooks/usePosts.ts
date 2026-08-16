import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as postsApi from "@/api/posts";
import type { Post } from "@/api/types";

export function usePosts() {
  return useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      postsApi.listPosts({ limit: 10, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getPost(id),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postsApi.createPost(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

interface PostsPage {
  data: Post[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

function toggled(post: Post): Post {
  return { ...post, likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) };
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postsApi.toggleLike(postId),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousLists = queryClient.getQueriesData<{ pages: PostsPage[] }>({ queryKey: ["posts"] });
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      queryClient.setQueriesData<{ pages: PostsPage[] } | undefined>({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((post) => (post.id === postId ? toggled(post) : post)),
          })),
        };
      });

      if (previousPost) {
        queryClient.setQueryData(["post", postId], toggled(previousPost));
      }

      return { previousLists, previousPost, postId };
    },
    onError: (_err, _postId, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousPost) {
        queryClient.setQueryData(["post", context.postId], context.previousPost);
      }
    },
    onSettled: (_data, _err, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
