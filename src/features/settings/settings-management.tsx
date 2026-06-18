"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AppearanceSettings } from "@/features/settings/appearance-settings";
import { useWorkspaceSettings } from "@/features/settings/workspace-settings-provider";
import { employeeFormFieldClassName } from "@/features/employees/employee-form-styles";
import {
  employeesPanelBodyClassName,
  employeesPanelClassName,
} from "@/features/employees/employees-panel-styles";

const settingsSchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(120),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsManagement() {
  const { settings, loading, updateSettings } = useWorkspaceSettings();
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ companyName: settings.companyName });
    }
  }, [settings, form]);

  async function onSubmit(values: SettingsForm) {
    setSaving(true);
    const result = await updateSettings({ companyName: values.companyName });
    setSaving(false);
    if (result.ok) {
      toast.success("Company name saved.");
    } else {
      toast.error(result.error);
    }
  }

  const companyLabel = settings?.companyName ?? "your workspace";

  return (
    <div className={employeesPanelClassName}>
      <div className={employeesPanelBodyClassName}>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">
                Choose how {companyLabel} looks on this device.
              </p>
            </div>
            <AppearanceSettings />
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <div>
              <h2 className="text-base font-semibold text-foreground">Company</h2>
              <p className="text-sm text-muted-foreground">
                This name appears in the sidebar and across the app.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <Input
                          className={employeeFormFieldClassName}
                          placeholder="Force Security Services"
                          disabled={loading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading || saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </Form>
          </section>
        </div>
      </div>
    </div>
  );
}
