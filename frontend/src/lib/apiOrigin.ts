/**
 * Origin of the API (scheme + host + port) for Socket.IO and non-fetch clients.
 * Uses URL parsing so hostnames like api.example.com are not broken by stripping "/api"
 * (naive .replace('/api', '') matches the slash before "api" in https://api.example.com).
 */
export function getApiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';
  try {
    return new URL(base).origin;
  } catch {
    return 'http://localhost:3002';
  }
}
