import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";

const DB_NAME = "yoonie_offline.db";

class TaskCache {
  private memoryCache = new Map<string, string>();
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  private async getDb(): Promise<SQLite.SQLiteDatabase | null> {
    if (Platform.OS === "web") return null;
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS local_cache (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
        return db;
      })();
    }
    return this.dbPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      if (db) {
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM local_cache WHERE key = ?",
          [key]
        );
        if (row?.value) {
          return JSON.parse(row.value) as T;
        }
        return null;
      }
      const mem = this.memoryCache.get(key);
      return mem ? (JSON.parse(mem) as T) : null;
    } catch (err) {
      console.warn(`[TaskCache] Failed to read cached key "${key}":`, err);
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    const serialized = JSON.stringify(data);
    const now = new Date().toISOString();
    try {
      const db = await this.getDb();
      if (db) {
        await db.runAsync(
          "INSERT OR REPLACE INTO local_cache (key, value, updated_at) VALUES (?, ?, ?)",
          [key, serialized, now]
        );
      } else {
        this.memoryCache.set(key, serialized);
      }
    } catch (err) {
      console.warn(`[TaskCache] Failed to write cache for "${key}":`, err);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDb();
      if (db) {
        await db.runAsync("DELETE FROM local_cache WHERE key = ?", [key]);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (err) {
      console.warn(`[TaskCache] Failed to delete cache for "${key}":`, err);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.getDb();
      if (db) {
        await db.runAsync("DELETE FROM local_cache");
      }
      this.memoryCache.clear();
    } catch (err) {
      console.warn("[TaskCache] Failed to clear all cache:", err);
    }
  }
}

export const taskCache = new TaskCache();

// Standard cache keys
export const CACHE_KEYS = {
  STAFF_TASKS: "cache:staff_tasks",
  HOUSEKEEPING_BOARD: "cache:housekeeping_board",
  DISPATCH_TASKS: "cache:dispatch_tasks",
  NOTIFICATIONS: "cache:notifications",
};
