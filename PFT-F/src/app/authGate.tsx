// src/app/AuthGate.tsx
import { useEffect, useState } from "react";
import { getAccessToken } from "../features/auth/tokenStore";
import {  refreshAccessToken } from "../lib/api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      if (!getAccessToken()) {
        await refreshAccessToken(); 
      }
      setReady(true);
    })();
  }, []);
  if (!ready) return <div className="p-6 text-white/70">Loading…</div>;
  return <>{children}</>;
}
