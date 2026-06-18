import { Toaster } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceSettingsProvider } from "@/features/settings/workspace-settings-provider";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceSettingsProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4 md:p-6">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </WorkspaceSettingsProvider>
  );
}
