import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/context/AuthContext";
import { useStartConversation } from "@/hooks/useChat";
import { resolveMediaUrl } from "@/api/client";
import { CardShadow, Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import type { Post } from "@/api/types";

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
}

function PostCardImpl({ post, onToggleLike }: PostCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const startConversation = useStartConversation();

  const isOwnPost = user?.id === post.author.id;

  function onMessageAuthor() {
    startConversation.mutate(post.author.id, {
      onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
    });
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, CardShadow]}>
      <Pressable onPress={() => router.push(`/post/${post.id}`)}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar username={post.author.username} />
            <View>
              <ThemedText type="smallBold">@{post.author.username}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatRelativeTime(post.createdAt)}
              </ThemedText>
            </View>
          </View>
          {!isOwnPost && (
            <Pressable onPress={onMessageAuthor} hitSlop={10} style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <ThemedText style={styles.content}>{post.content}</ThemedText>

        {post.imageUrl && (
          <Image
            source={{ uri: resolveMediaUrl(post.imageUrl) }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        )}
      </Pressable>

      <View style={styles.footer}>
        <Pressable style={styles.action} onPress={() => onToggleLike(post.id)} hitSlop={8}>
          <ThemedText style={{ color: post.likedByMe ? theme.danger : theme.textSecondary }}>
            {post.likedByMe ? "♥" : "♡"} {post.likeCount}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.action} onPress={() => router.push(`/post/${post.id}`)} hitSlop={8}>
          <ThemedText themeColor="textSecondary">💬 {post.commentCount}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export const PostCard = memo(PostCardImpl);

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  messageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    marginTop: Spacing.one,
  },
  image: {
    marginTop: Spacing.two,
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
  },
});
