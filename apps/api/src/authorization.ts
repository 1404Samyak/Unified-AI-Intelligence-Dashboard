import type { RegisteredTool, ToolCallPlan } from "./types.js";
import type { UserRole } from "./auth.js";

const adminActionPattern = /\b(admin|create|add|update|edit|delete|remove|mark|publish)\b/i;
const selfServiceExceptions = /\b(register for|cancel.*registration|reserve|renew|rate|feedback)\b/i;

export const isAdminTool = (tool: Pick<RegisteredTool, "description" | "name">) =>
  tool.description?.toLowerCase().startsWith("admin:") ||
  /^(create|update|delete|mark)_/.test(tool.name);

export const filterToolsForRole = (tools: RegisteredTool[], role: UserRole) =>
  role === "admin" ? tools : tools.filter((tool) => !isAdminTool(tool));

export const hasAdminIntent = (message: string) =>
  adminActionPattern.test(message) && !selfServiceExceptions.test(message);

export const partitionToolCallsByRole = (
  calls: ToolCallPlan[],
  tools: RegisteredTool[],
  role: UserRole
) => {
  if (role === "admin") {
    return { allowed: calls, denied: [] };
  }

  const toolMap = new Map(tools.map((tool) => [tool.qualifiedName, tool]));
  const allowed: ToolCallPlan[] = [];
  const denied: ToolCallPlan[] = [];

  for (const call of calls) {
    const tool = toolMap.get(call.qualifiedName);
    if (tool && isAdminTool(tool)) {
      denied.push(call);
    } else {
      allowed.push(call);
    }
  }

  return { allowed, denied };
};
