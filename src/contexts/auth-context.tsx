"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  getAccessToken,
  saveTokens,
  clearTokens,
} from "@/lib/auth";
import api from "@/lib/api";

interface User {
  username: string;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_EVENT = "auth:tokens-updated";

// Cache the last computed user keyed by token so useSyncExternalStore receives
// a referentially-stable snapshot when nothing has changed.
let cachedToken: string | null = null;
let cachedUser: User | null = null;

function computeUserFromToken(token: string): User {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { username: payload.sub ?? "Admin" };
  } catch {
    return { username: "Admin" };
  }
}

function getUserSnapshot(): User | null {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  if (token === cachedToken) return cachedUser;
  cachedToken = token;
  cachedUser = token ? computeUserFromToken(token) : null;
  return cachedUser;
}

function getServerUserSnapshot(): User | null {
  return null;
}

function subscribeAuth(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT, cb);
  // Sync across tabs.
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(AUTH_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    subscribeAuth,
    getUserSnapshot,
    getServerUserSnapshot,
  );
  const isLoggedIn = user !== null;

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post<{
      access_token: string;
      refresh_token: string;
    }>("/api/auth/login", { username, password });
    const { access_token, refresh_token } = response.data;
    saveTokens(access_token, refresh_token);
    emitAuthChange();
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    emitAuthChange();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
