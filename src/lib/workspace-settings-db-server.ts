import { getDb } from "@/lib/mongodb";
import {
  defaultWorkspaceSettingsValues,
  parseWorkspaceSettings,
  type WorkspaceSettings,
  type WorkspaceSettingsUpdate,
} from "@/lib/workspace-settings-schema";
import {
  WORKSPACE_SETTINGS_COLLECTION,
  WORKSPACE_SETTINGS_DOCUMENT_ID,
} from "@/lib/workspace-settings-mongo-constants";

function serializeSettingsDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const o = { ...doc };
  delete o._id;
  return o;
}

export async function loadWorkspaceSettingsFromDb(): Promise<WorkspaceSettings> {
  const db = await getDb();
  const col = db.collection(WORKSPACE_SETTINGS_COLLECTION);
  const existing = await col.findOne({ id: WORKSPACE_SETTINGS_DOCUMENT_ID });

  if (existing) {
    const parsed = parseWorkspaceSettings(serializeSettingsDoc(existing as Record<string, unknown>));
    if (parsed) return parsed;
  }

  const now = new Date().toISOString();
  const created: WorkspaceSettings = {
    id: WORKSPACE_SETTINGS_DOCUMENT_ID,
    companyName: defaultWorkspaceSettingsValues.companyName,
    appearance: defaultWorkspaceSettingsValues.appearance,
    createdAt: now,
    updatedAt: now,
  };

  await col.updateOne(
    { id: WORKSPACE_SETTINGS_DOCUMENT_ID },
    { $setOnInsert: created },
    { upsert: true },
  );

  const doc = await col.findOne({ id: WORKSPACE_SETTINGS_DOCUMENT_ID });
  const parsed = parseWorkspaceSettings(
    serializeSettingsDoc((doc ?? created) as Record<string, unknown>),
  );
  if (!parsed) {
    throw new Error("Failed to initialize workspace settings.");
  }
  return parsed;
}

export async function updateWorkspaceSettingsInDb(
  patch: WorkspaceSettingsUpdate,
): Promise<WorkspaceSettings> {
  const current = await loadWorkspaceSettingsFromDb();
  const now = new Date().toISOString();

  const updated: WorkspaceSettings = {
    ...current,
    ...(patch.companyName !== undefined ? { companyName: patch.companyName } : {}),
    ...(patch.appearance !== undefined ? { appearance: patch.appearance } : {}),
    updatedAt: now,
  };

  const db = await getDb();
  await db
    .collection(WORKSPACE_SETTINGS_COLLECTION)
    .updateOne({ id: WORKSPACE_SETTINGS_DOCUMENT_ID }, { $set: updated }, { upsert: true });

  return updated;
}
