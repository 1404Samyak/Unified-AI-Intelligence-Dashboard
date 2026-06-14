const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const tokenKey = "campus-auth-token";

export type AuthUser = {
  id: string;
  role: "student" | "admin";
  name: string;
  email: string;
  yearOfStudy?: number;
  branch?: string;
  semester?: 1 | 2;
  enrollmentNumber?: string;
  teacherId?: string;
  department?: string;
};

export type RegisterPayload =
  | {
      role: "student";
      name: string;
      email: string;
      password: string;
      yearOfStudy: number;
      branch: string;
      semester: 1 | 2;
      enrollmentNumber: string;
    }
  | {
      role: "admin";
      name: string;
      email: string;
      password: string;
      teacherId: string;
      department: string;
    };

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type ToolResult = {
  qualifiedName: string;
  arguments: Record<string, unknown>;
  domain: "library" | "cafeteria" | "events" | "academics";
  toolName: string;
  ok: boolean;
  data?: unknown;
  error?: string;
  reason: string;
};

export type ChatResponse = {
  answer: string;
  model: string;
  usedOllama: boolean;
  usedFallbackRouter: boolean;
  toolCalls: Array<{
    qualifiedName: string;
    arguments: Record<string, unknown>;
    reason: string;
  }>;
  toolResults: ToolResult[];
  unavailableServers: string[];
};

export type RegisteredTool = {
  domain: "library" | "cafeteria" | "events" | "academics";
  name: string;
  qualifiedName: string;
  description?: string;
};

export const getStoredToken = () => localStorage.getItem(tokenKey);

export const setStoredToken = (token: string) => {
  localStorage.setItem(tokenKey, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(tokenKey);
};

const authHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { authorization: `Bearer ${token}` } : {};
};

async function parseResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload as T;
}

export async function getHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  return parseResponse<{ ollama?: { model?: string } }>(response);
}

export async function getDashboard() {
  const response = await fetch(`${API_URL}/api/dashboard`, {
    headers: authHeaders()
  });
  return parseResponse<{ cards: ToolResult[] }>(response);
}

export async function getTools() {
  const response = await fetch(`${API_URL}/api/tools`, {
    headers: authHeaders()
  });
  return parseResponse<{ tools: RegisteredTool[]; unavailableServers: string[] }>(response);
}

export async function sendChat(message: string) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message })
  });
  return parseResponse<ChatResponse>(response);
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse<AuthResponse>(response);
}

export async function loginUser(payload: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse<AuthResponse>(response);
}

export async function getMe() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders()
  });
  return parseResponse<{ user: AuthUser }>(response);
}
