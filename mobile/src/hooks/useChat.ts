import { Alert } from "react-native";
import { useInfiniteQuery, useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/api/chat";
import { ApiClientError } from "@/api/client";
import type { Message } from "@/api/types";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatApi.listConversations(),
    refetchInterval: 15000,
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chatApi.getConversation(conversationId),
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string) {
  // Paused while a send is in flight: the 4s poll's own success handler
  // would otherwise overwrite the optimistic message onMutate just inserted
  // (cancelQueries only aborts requests already in flight, not this timer).
  const sending = useIsMutating({ mutationKey: sendMessageMutationKey(conversationId) }) > 0;

  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      chatApi.listMessages(conversationId, { limit: 30, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? (lastPage.meta.nextCursor ?? undefined) : undefined),
    enabled: !!conversationId,
    refetchInterval: sending ? false : 4000,
  });
}

function sendMessageMutationKey(conversationId: string) {
  return ["sendMessage", conversationId];
}

export function useStartConversation() {
  return useMutation({
    mutationFn: (userId: string) => chatApi.startConversation(userId),
    onError: (err) => {
      const message = err instanceof ApiClientError ? err.message : "Couldn't start the conversation, try again.";
      Alert.alert("Message failed", message);
    },
  });
}

interface MessagesPage {
  data: Message[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

type MessagesCache = { pages: MessagesPage[]; pageParams: unknown[] };

export function useSendMessage(conversationId: string, me: { id: string; username: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["messages", conversationId];

  return useMutation({
    mutationKey: sendMessageMutationKey(conversationId),
    mutationFn: (body: { content?: string; imageUrl?: string }) => chatApi.sendMessage(conversationId, body),
    onMutate: async (body: { content?: string; imageUrl?: string }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MessagesCache>(queryKey);

      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conversationId,
        sender: me,
        content: body.content ?? null,
        imageUrl: body.imageUrl ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<MessagesCache>(queryKey, (old) => {
        if (!old || old.pages.length === 0) {
          return { pages: [{ data: [optimisticMessage], meta: { nextCursor: null, hasMore: false } }], pageParams: [undefined] };
        }
        const [firstPage, ...rest] = old.pages;
        return { ...old, pages: [{ ...firstPage, data: [optimisticMessage, ...firstPage.data] }, ...rest] };
      });

      return { previous, optimisticId: optimisticMessage.id };
    },
    onError: (_err, _body, context) => {
      // `previous` is legitimately undefined for the first message in a
      // brand-new conversation - checking `context` itself (always set by
      // onMutate) rather than `context.previous` so that case still rolls
      // back instead of leaving the failed optimistic message stuck.
      if (context) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (message, _body, context) => {
      queryClient.setQueryData<MessagesCache>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m.id === context?.optimisticId ? message : m)),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
