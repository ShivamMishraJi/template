"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceSettings } from "@/features/settings/workspace-settings-provider";
import { defaultWorkspaceSettingsValues } from "@/lib/workspace-settings-schema";
import { cn } from "@/lib/utils";

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  const { settings, loading } = useWorkspaceSettings();
  const companyName = settings?.companyName ?? defaultWorkspaceSettingsValues.companyName;

  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 transition-colors hover:bg-sidebar-accent"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/90 text-primary-foreground">
        <Shield className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">
          {loading ? defaultWorkspaceSettingsValues.companyName : companyName}
        </p>
        <p className="truncate text-xs text-sidebar-muted">Enterprise HRMS</p>
      </div>
    </Link>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        className,
      )}
    >
      <SidebarBrand />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-3">
        <ScrollArea className="h-full min-h-[200px]">
          <SidebarNav />
        </ScrollArea>
      </div>
    </aside>
  );
}

export function AppSidebarMobileContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarBrand onNavigate={onNavigate} />
      <div className="flex-1 overflow-hidden p-3">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <SidebarNav onNavigate={onNavigate} />
        </ScrollArea>
      </div>
    </div>
  );
}
