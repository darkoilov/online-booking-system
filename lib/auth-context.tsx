"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient, setAuthToken, clearAuthToken } from "./api-client";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "OWNER" | "STAFF" | "ADMIN";
  businessId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const res = await apiClient.get<{ user: AuthUser }>("/auth/me");
    if (res.data?.user) {
      setUser(res.data.user);
    } else {
      setUser(null);
      clearAuthToken();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const res = await apiClient.post<{ token: string; user: AuthUser }>(
      "/auth/login",
      { email, password }
    );

    if (res.error) {
      return { error: res.error };
    }

    if (res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
    }

    return {};
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const res = await apiClient.post<{ token: string; user: AuthUser }>(
      "/auth/register",
      { fullName, email, password }
    );

    if (res.error) {
      return { error: res.error };
    }

    if (res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
    }

    return {};
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
