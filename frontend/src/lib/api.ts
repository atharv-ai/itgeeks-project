/**
 * src/lib/api.ts
 * Typed fetch wrapper that automatically attaches the Authorization header.
 * All components should import apiFetch (and API_BASE_URL) from here
 * instead of calling fetch() or defining their own base URL.
 */

import { getToken } from "@/lib/auth"

export const API_BASE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ||
  "http://localhost:8000"

export type ApiRequestInit = Omit<RequestInit, "body"> & {
  /** Pass a plain object and it will be JSON-serialised automatically. */
  json?: unknown
  /** Pass a FormData to send multipart (skips JSON serialisation). */
  body?: BodyInit | null
}

/**
 * Drop-in replacement for fetch() that:
 *  1. Prepends API_BASE_URL when the path starts with "/"
 *  2. Attaches Authorization: Bearer <token> from localStorage
 *  3. Sets Content-Type: application/json when `json` option is provided
 */
export async function apiFetch(
  path: string,
  options: ApiRequestInit = {}
): Promise<Response> {
  const { json, body, headers: extraHeaders, ...rest } = options

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`

  const headers = new Headers(extraHeaders as HeadersInit)

  const token = getToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let resolvedBody: BodyInit | null | undefined = body

  if (json !== undefined) {
    headers.set("Content-Type", "application/json")
    resolvedBody = JSON.stringify(json)
  }

  return fetch(url, { ...rest, headers, body: resolvedBody })
}
