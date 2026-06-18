import { z } from "zod";

export const appearanceSchema = z.enum(["light", "dark", "system"]);

export type Appearance = z.infer<typeof appearanceSchema>;

export const workspaceSettingsSchema = z.object({
  id: z.literal("workspace"),
  companyName: z.string().min(2, "Company name is required").max(120),
  appearance: appearanceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;

export const workspaceSettingsUpdateSchema = z
  .object({
    companyName: z.string().min(2, "Company name is required").max(120).optional(),
    appearance: appearanceSchema.optional(),
  })
  .refine((data) => data.companyName !== undefined || data.appearance !== undefined, {
    message: "At least one setting must be provided.",
  });

export type WorkspaceSettingsUpdate = z.infer<typeof workspaceSettingsUpdateSchema>;

export const defaultWorkspaceSettingsValues = {
  companyName: "Force Security Services",
  appearance: "system" as const,
};

export function parseWorkspaceSettings(raw: unknown): WorkspaceSettings | null {
  const parsed = workspaceSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
