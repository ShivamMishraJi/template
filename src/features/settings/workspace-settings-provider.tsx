"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getWorkspaceSettings,
  updateWorkspaceSettings as updateWorkspaceSettingsApi,
} from "@/lib/workspace-settings-api";
import type {
  WorkspaceSettings,
  WorkspaceSettingsUpdate,
} from "@/lib/workspace-settings-schema";

type WorkspaceSettingsContextValue = {
  settings: WorkspaceSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (
    patch: WorkspaceSettingsUpdate,
  ) => Promise<{ ok: true; settings: WorkspaceSettings } | { ok: false; error: string }>;
};

const WorkspaceSettingsContext = createContext<WorkspaceSettingsContextValue | null>(null);

function ThemeFromSettings({ appearance }: { appearance: WorkspaceSettings["appearance"] }) {
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    setTheme(appearance);
  }, [appearance, setTheme]);

  return null;
}

export function WorkspaceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const loaded = await getWorkspaceSettings();
      setSettings(loaded);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (patch: WorkspaceSettingsUpdate) => {
    const result = await updateWorkspaceSettingsApi(patch);
    if (result.ok) {
      setSettings(result.settings);
    }
    return result;
  }, []);

  return (
    <WorkspaceSettingsContext.Provider
      value={{ settings, loading, refresh, updateSettings }}
    >
      {settings ? <ThemeFromSettings appearance={settings.appearance} /> : null}
      {children}
    </WorkspaceSettingsContext.Provider>
  );
}

export function useWorkspaceSettings(): WorkspaceSettingsContextValue {
  const ctx = useContext(WorkspaceSettingsContext);
  if (!ctx) {
    throw new Error("useWorkspaceSettings must be used within WorkspaceSettingsProvider.");
  }
  return ctx;
}
