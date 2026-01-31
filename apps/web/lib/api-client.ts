const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ApiOptions extends RequestInit {
  body?: any;
}

export async function apiClient<T>(
  endpoint: string,
  { body, ...customConfig }: ApiOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    credentials: "include",
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: any, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "POST", body }),
  put: <T>(endpoint: string, body: any, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T>(endpoint: string, body: any, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T>(endpoint: string, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
