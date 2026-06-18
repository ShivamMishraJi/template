"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkspaceSettings } from "@/features/settings/workspace-settings-provider";
import type { Appearance } from "@/lib/workspace-settings-schema";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useWorkspaceSettings();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState<Appearance | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleThemeChange(value: Appearance) {
    setTheme(value);
    setSaving(value);
    const result = await updateSettings({ appearance: value });
    setSaving(null);
    if (result.ok) {
      toast.success("Appearance saved.");
    } else {
      toast.error(result.error);
    }
  }

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {themeOptions.map((option) => (
          <div key={option.value} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  const selectedTheme = theme ?? settings?.appearance;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const selected = selectedTheme === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={selected ? "default" : "outline"}
            className={cn("justify-start gap-2", !selected && "bg-background")}
            disabled={saving !== null}
            onClick={() => void handleThemeChange(option.value)}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
