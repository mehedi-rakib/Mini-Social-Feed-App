import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "@/api/auth";
import { setAuthToken, setUnauthorizedHandler } from "@/api/client";
import type { PublicUser } from "@/api/types";

const TOKEN_KEY = "auth_token";

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setUser(null);
      SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setAuthToken(token);
        const me = await authApi.me();
        setUser(me);
      } catch {
        setAuthToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(email, password) {
        const result = await authApi.login({ email, password });
        await SecureStore.setItemAsync(TOKEN_KEY, result.token);
        setAuthToken(result.token);
        setUser(result.user);
      },
      async signup(username, email, password, displayName) {
        const result = await authApi.signup({ username, email, password, displayName });
        await SecureStore.setItemAsync(TOKEN_KEY, result.token);
        setAuthToken(result.token);
        setUser(result.user);
      },
      async logout() {
        setAuthToken(null);
        setUser(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
