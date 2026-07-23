const DEFAULT_API_URL = "http://localhost:4000/api";
const DEFAULT_WS_URL = "ws://localhost:4000/collab";

/** REST API base URL (`NEXT_PUBLIC_API_URL`). */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

/** Derive a collab WebSocket URL from the REST API URL when WS is not set explicitly. */
function deriveWsUrlFromApi(apiUrl: string): string {
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/collab`;
  } catch {
    return DEFAULT_WS_URL;
  }
}

/**
 * WebSocket collab endpoint (`NEXT_PUBLIC_WS_URL`).
 * Upgrades ws:// → wss:// when the page is served over HTTPS so browsers
 * do not block mixed-content WebSocket connections.
 */
export function getWsUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_WS_URL?.trim() || deriveWsUrlFromApi(getApiUrl());

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return configured.replace(/^ws:\/\//i, "wss://");
  }

  return configured;
}
