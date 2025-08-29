import React, { createContext, useContext, useEffect, useState } from "react";
import { loginRequest, meRequest, logoutRequest, type MeResponse } from "./authApi";
import { setAccessToken, clearAccessToken, getPersistFlag } from "./tokenStore";

type AuthContextType = {
  user: MeResponse | null;
  loading: boolean;
  login: (opts: { email: string; password: string; remember: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
};

const Ctx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (getPersistFlag()) {
          const me = await meRequest();
          setUser(me);
        }
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login({ email, password, remember }: { email: string; password: string; remember: boolean }) {
    const data = await loginRequest({ email, password }); // <-- email gönder
    setAccessToken(data.access_token, remember);          // refresh cookie backend'de
    const me = await meRequest();
    setUser(me);
  }

  async function reloadMe() {
    const me = await meRequest();
    setUser(me);
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }

  const value: AuthContextType = { user, loading, login, logout, reloadMe };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider/>");
  return ctx;
}
