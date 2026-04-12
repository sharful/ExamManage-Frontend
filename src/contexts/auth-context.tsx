"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  saveTokens,
  clearTokens,
  isAuthenticated,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      // Decode the username from stored token or just mark as logged in
      const token = getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({ username: payload.sub ?? "Admin" });
        } catch {
          setUser({ username: "Admin" });
        }
        setIsLoggedIn(true);
      }
    }
  }, []);

  async function login(username: string, password: string) {
    const response = await api.post<{
      access_token: string;
      refresh_token: string;
    }>("/api/auth/login", { username, password });
    const { access_token, refresh_token } = response.data;
    saveTokens(access_token, refresh_token);
    try {
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      setUser({ username: payload.sub ?? username });
    } catch {
      setUser({ username });
    }
    setIsLoggedIn(true);
  }

  function logout() {
    clearTokens();
    setUser(null);
    setIsLoggedIn(false);
  }

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
