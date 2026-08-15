import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { setupPushNotifications } from "@/lib/notifications";

export function RootNavigationGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushSetupDone = useRef(false);

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments, router]);

  useEffect(() => {
    if (user && !pushSetupDone.current) {
      pushSetupDone.current = true;
      setupPushNotifications().catch((err) => console.error("push setup failed:", err));
    }
  }, [user]);

  return <>{children}</>;
}
