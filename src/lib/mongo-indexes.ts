import type { Db } from "mongodb";
import { ATTENDANCE_COLLECTION } from "@/lib/attendance-mongo-constants";
import { PAYROLL_EMPLOYEES_COLLECTION } from "@/lib/payroll-employees-mongo-constants";
import { WORKSPACE_SETTINGS_COLLECTION } from "@/lib/workspace-settings-mongo-constants";

const caseInsensitiveCollation = { locale: "en", strength: 2 } as const;

declare global {
  var __mongoIndexesEnsured: Promise<void> | undefined;
}

async function ensureIndexesOnDb(db: Db): Promise<void> {
  const attendance = db.collection(ATTENDANCE_COLLECTION);
  const employees = db.collection(PAYROLL_EMPLOYEES_COLLECTION);
  const settings = db.collection(WORKSPACE_SETTINGS_COLLECTION);

  await Promise.all([
    attendance.createIndex({ month: 1, year: 1, createdAt: -1 }),
    attendance.createIndex(
      { month: 1, year: 1, agencyNo: 1 },
      { collation: caseInsensitiveCollation },
    ),
    attendance.createIndex(
      { agencyNo: 1, year: -1, month: -1 },
      { collation: caseInsensitiveCollation },
    ),
    attendance.createIndex({ id: 1 }, { unique: true, sparse: true }),

    employees.createIndex({ id: 1 }, { unique: true }),
    employees.createIndex({ agencyIdNo: 1 }, { collation: caseInsensitiveCollation }),
    employees.createIndex({ deletedAt: 1, createdAt: -1 }),
    employees.createIndex({ deletedAt: 1, employmentStatus: 1, createdAt: -1 }),
    employees.createIndex({ deletedAt: 1, siteName: 1, createdAt: -1 }),

    settings.createIndex({ id: 1 }, { unique: true }),
  ]);
}

export function ensureMongoIndexes(db: Db): Promise<void> {
  if (!globalThis.__mongoIndexesEnsured) {
    globalThis.__mongoIndexesEnsured = ensureIndexesOnDb(db).catch((error) => {
      globalThis.__mongoIndexesEnsured = undefined;
      throw error;
    });
  }
  return globalThis.__mongoIndexesEnsured;
}
