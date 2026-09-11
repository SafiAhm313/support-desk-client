"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, ApiError } from "./api";
import { getToken, setToken, clearToken } from "./session";

type Role = "customer" | "agent" | "admin";
interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

interface LoginResponse {
  accessToken: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    setTokenState(stored);
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        clearToken();
        setTokenState(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuthRedirect: true,
    });
    setToken(res.accessToken);
    setTokenState(res.accessToken);
    const me = await apiFetch<User>("/auth/me");
    setUser(me);
  }

  async function register(fullName: string, email: string, password: string) {
    await apiFetch<User>("/auth/register", {
      method: "POST",
      body: { fullName, email, password },
    });
    await login(email, password);
  }

  function logout() {
    clearToken();
    setTokenState(null);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
