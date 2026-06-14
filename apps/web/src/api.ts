const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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

export async function getHealth() {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error("Backend health check failed");
  return response.json();
}

export async function getDashboard() {
  const response = await fetch(`${API_URL}/api/dashboard`);
  if (!response.ok) throw new Error("Dashboard request failed");
  return response.json() as Promise<{ cards: ToolResult[] }>;
}

export async function getTools() {
  const response = await fetch(`${API_URL}/api/tools`);
  if (!response.ok) throw new Error("Tools request failed");
  return response.json() as Promise<{ tools: RegisteredTool[]; unavailableServers: string[] }>;
}

export async function sendChat(message: string) {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      student: {
        studentId: "stu-1001",
        name: "Aarav Sharma",
        department: "Computer Science",
        semester: 5,
        dietaryPreference: "veg",
        interests: ["ai", "hackathons", "database systems"]
      }
    })
  });
  if (!response.ok) throw new Error("Chat request failed");
  return response.json() as Promise<ChatResponse>;
}
