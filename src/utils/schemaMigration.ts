/**
 * Schema Migration System
 * 
 * Handles automatic data migration when schemas change.
 * 
 * @module schemaMigration
 */

import { get, set } from 'idb-keyval';

/**
 * Current schema version
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Schema migration function type
 */
type MigrationFn = (data: unknown) => unknown;

/**
 * Migration definition
 */
interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: MigrationFn;
}

/**
 * Migration registry
 */
const migrations: Migration[] = [
  // Example migration from version 0 to 1
  {
    fromVersion: 0,
    toVersion: 1,
    migrate: (data) => {
      // Add default fields that didn't exist before
      if (typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>;
        return {
          ...d,
          schemaVersion: 1,
          migratedAt: Date.now(),
        };
      }
      return data;
    },
  },
];

/**
 * Get stored schema version
 */
export async function getStoredSchemaVersion(): Promise<number> {
  try {
    const version = await get<number>('schema-version');
    return version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Set stored schema version
 */
export async function setStoredSchemaVersion(version: number): Promise<void> {
  await set('schema-version', version);
}

/**
 * Run migrations from current version to target version
 */
export async function runMigrations(
  data: unknown,
  currentVersion: number,
  targetVersion: number
): Promise<{ data: unknown; migrated: boolean; path: number[] }> {
  let migratedData = data;
  const migrationPath: number[] = [];
  
  for (const migration of migrations) {
    if (
      migration.fromVersion >= currentVersion &&
      migration.toVersion <= targetVersion
    ) {
      migratedData = migration.migrate(migratedData);
      migrationPath.push(migration.fromVersion);
    }
  }
  
  return {
    data: migratedData,
    migrated: migrationPath.length > 0,
    path: migrationPath,
  };
}

/**
 * Migrate data to current schema version
 */
export async function migrateToCurrentVersion<T>(
  data: unknown,
  key: string
): Promise<T | null> {
  const storedVersion = await getStoredSchemaVersion();
  
  if (storedVersion >= CURRENT_SCHEMA_VERSION) {
    return data as T;
  }
  
  const result = await runMigrations(data, storedVersion, CURRENT_SCHEMA_VERSION);
  
  if (result.migrated) {
    // Save migrated data
    await set(key, result.data);
  }
  
  return result.data as T;
}

/**
 * Check if migration is needed
 */
export async function isMigrationNeeded(): Promise<boolean> {
  const storedVersion = await getStoredSchemaVersion();
  return storedVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Force reset schema version (for testing)
 */
export async function resetSchemaVersion(): Promise<void> {
  await set('schema-version', 0);
}

/**
 * Create backup before migration
 */
export async function createMigrationBackup<T>(key: string, data: T): Promise<void> {
  const backupKey = `${key}-backup-${Date.now()}`;
  await set(backupKey, {
    data,
    schemaVersion: await getStoredSchemaVersion(),
    timestamp: Date.now(),
  });
}

/**
 * Get migration status for UI display
 */
export async function getMigrationStatus(): Promise<{
  currentVersion: number;
  latestVersion: number;
  needsMigration: boolean;
  pendingMigrations: number;
}> {
  const currentVersion = await getStoredSchemaVersion();
  const needsMigration = currentVersion < CURRENT_SCHEMA_VERSION;
  
  const pendingMigrations = migrations.filter(
    m => m.fromVersion >= currentVersion && m.toVersion <= CURRENT_SCHEMA_VERSION
  ).length;
  
  return {
    currentVersion,
    latestVersion: CURRENT_SCHEMA_VERSION,
    needsMigration,
    pendingMigrations,
  };
}
