import { memo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
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

const DOUBLE_TAP_DELAY = 260;

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
}

function PostCardImpl({ post, onToggleLike }: PostCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const startConversation = useStartConversation();
  const lastImageTapRef = useRef(0);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const isOwnPost = user?.id === post.author.id;

  function onMessageAuthor() {
    startConversation.mutate(post.author.id, {
      onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
    });
  }

  function onOpenProfile() {
    router.push(`/profile/${post.author.username}`);
  }

  function onImagePress() {
    const now = Date.now();
    if (now - lastImageTapRef.current < DOUBLE_TAP_DELAY) {
      lastImageTapRef.current = 0;
      heartScale.value = withSequence(withTiming(1.15, { duration: 180 }), withTiming(1, { duration: 100 }));
      heartOpacity.value = withSequence(withTiming(1, { duration: 120 }), withDelay(350, withTiming(0, { duration: 220 })));
      if (!post.likedByMe) onToggleLike(post.id);
    } else {
      lastImageTapRef.current = now;
    }
  }

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <ThemedView type="backgroundElement" style={[styles.card, CardShadow]}>
      <Pressable onPress={() => router.push(`/post/${post.id}`)}>
        <View style={styles.header}>
          <Pressable onPress={onOpenProfile} hitSlop={6} style={styles.headerLeft}>
            <Avatar username={post.author.username} />
            <View>
              <ThemedText type="smallBold">@{post.author.username}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatRelativeTime(post.createdAt)}
              </ThemedText>
            </View>
          </Pressable>
          {!isOwnPost && (
            <Pressable onPress={onMessageAuthor} hitSlop={10} style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <ThemedText style={styles.content}>{post.content}</ThemedText>
      </Pressable>

      {post.imageUrl && (
        <Pressable onPress={onImagePress} style={styles.imageWrapper}>
          <Image
            source={{ uri: resolveMediaUrl(post.imageUrl) }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
          <Animated.View pointerEvents="none" style={[styles.heartOverlay, heartAnimatedStyle]}>
            <Ionicons name="heart" size={72} color="#ffffff" style={styles.heartIcon} />
          </Animated.View>
        </Pressable>
      )}

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
  imageWrapper: {
    width: "100%",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: Spacing.two,
  },
  heartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: {
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
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
