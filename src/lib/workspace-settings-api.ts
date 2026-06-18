import {
  parseWorkspaceSettings,
  type WorkspaceSettings,
  type WorkspaceSettingsUpdate,
} from "@/lib/workspace-settings-schema";

const BASE = "/api/settings";

function errorMessageFromResponse(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return fallback;
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const res = await fetch(BASE, { cache: "no-store" });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(errorMessageFromResponse(data, "Failed to load settings."));
  }
  const parsed = parseWorkspaceSettings(data);
  if (!parsed) {
    throw new Error("Invalid settings response from server.");
  }
  return parsed;
}

export async function updateWorkspaceSettings(
  patch: WorkspaceSettingsUpdate,
): Promise<{ ok: true; settings: WorkspaceSettings } | { ok: false; error: string }> {
  const res = await fetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, error: errorMessageFromResponse(data, "Failed to save settings.") };
  }
  const parsed = parseWorkspaceSettings(data);
  if (!parsed) {
    return { ok: false, error: "Invalid settings response from server." };
  }
  return { ok: true, settings: parsed };
}
