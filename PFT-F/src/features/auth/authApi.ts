import { postJSON, getJSON } from "../../lib/api";

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: { id: string; username: string; email: string };
};

export type MeResponse = {
  id: string;
  username: string;
  email: string;
};

export async function loginRequest(payload: { email: string; password: string }) {
  // FastAPI: /auth/login -> JSON access token + refresh cookie set
  return postJSON<LoginResponse>("/auth/login", payload);
}

export async function meRequest() {
  return getJSON<MeResponse>("/auth/me");
}

export async function logoutRequest() {
  // Cookie siler
  return postJSON<{ msg: string }>("/auth/logout", {});
}
