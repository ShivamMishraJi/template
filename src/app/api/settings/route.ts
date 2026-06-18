import { NextResponse } from "next/server";
import { isMongoConnectionError, MONGO_UNAVAILABLE } from "@/lib/mongo-api-errors";
import {
  loadWorkspaceSettingsFromDb,
  updateWorkspaceSettingsInDb,
} from "@/lib/workspace-settings-db-server";
import { workspaceSettingsUpdateSchema } from "@/lib/workspace-settings-schema";

export async function GET() {
  try {
    const settings = await loadWorkspaceSettingsFromDb();
    return NextResponse.json(settings);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = workspaceSettingsUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings data.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const settings = await updateWorkspaceSettingsInDb(parsed.data);
    return NextResponse.json(settings);
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return NextResponse.json({ error: MONGO_UNAVAILABLE }, { status: 503 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
