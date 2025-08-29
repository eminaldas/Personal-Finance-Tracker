// Basit bir in-memory token (sayfa yenilenince sıfırlanır)
let _accessToken: string | null = null;
let _persist = false; // remember me

export function setAccessToken(token: string, persist = false) {
  _accessToken = token;
  _persist = persist;
  if (persist) {
    localStorage.setItem("access_token", token);
    localStorage.setItem("persist_login", "1");
  } else {
    localStorage.removeItem("access_token");
    localStorage.removeItem("persist_login");
  }
}

export function getAccessToken(): string | null {
  if (_accessToken) return _accessToken;
  const shouldPersist = localStorage.getItem("persist_login") === "1";
  if (shouldPersist) {
    _accessToken = localStorage.getItem("access_token");
  }
  return _accessToken;
}

export function clearAccessToken() {
  _accessToken = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("persist_login");
}

export function getPersistFlag() {
  return _persist || localStorage.getItem("persist_login") === "1";
}
