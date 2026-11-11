
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8001";

export const API_URL = `${API_BASE_URL}/api`;

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });
}
