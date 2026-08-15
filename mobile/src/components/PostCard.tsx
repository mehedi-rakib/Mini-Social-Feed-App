import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import { formatRelativeTime } from "@/lib/time";
import type { Post } from "@/api/types";

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
}

function PostCardImpl({ post, onToggleLike }: PostCardProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable onPress={() => router.push(`/post/${post.id}`)}>
        <View style={styles.header}>
          <ThemedText type="smallBold">@{post.author.username}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatRelativeTime(post.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.content}>{post.content}</ThemedText>
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
  content: {
    marginTop: Spacing.one,
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
