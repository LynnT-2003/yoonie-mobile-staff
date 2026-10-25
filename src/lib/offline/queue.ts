import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import {
  postRequest,
  patchRequest,
  putRequest,
  deleteRequest,
} from "../domain/api/NetworkManager";

export interface QueuedMutation {
  id: number;
  action: string;
  url: string;
  method: "POST" | "PATCH" | "PUT" | "DELETE";
  payload: string;
  idempotency_key: string;
  created_at: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "DROPPED";
  retry_count: number;
  error_message?: string | null;
}

const DB_NAME = "yoonie_offline.db";
const MAX_RETRIES = 3;

class MutationQueue {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private isProcessing = false;
  private memoryQueue: QueuedMutation[] = [];
  private memoryIdCounter = 1;
  private listeners: (() => void)[] = [];
  private conflictRefetchListeners: (() => void)[] = [];
  private userMessageListeners: ((message: string) => void)[] = [];
  public lastUserMessage: string | null = null;

  private async getDb(): Promise<SQLite.SQLiteDatabase | null> {
    if (Platform.OS === "web") {
      return null;
    }
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS mutation_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            action TEXT NOT NULL,
            url TEXT NOT NULL,
            method TEXT NOT NULL,
            payload TEXT NOT NULL,
            idempotency_key TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            retry_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT
          );
        `);
        return db;
      })();
    }
    return this.dbPromise;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onConflictRefetch(listener: () => void): () => void {
    this.conflictRefetchListeners.push(listener);
    return () => {
      this.conflictRefetchListeners = this.conflictRefetchListeners.filter(
        (l) => l !== listener
      );
    };
  }

  onUserMessage(listener: (msg: string) => void): () => void {
    this.userMessageListeners.push(listener);
    return () => {
      this.userMessageListeners = this.userMessageListeners.filter(
        (l) => l !== listener
      );
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("[MutationQueue] Listener error:", err);
      }
    });
  }

  private triggerConflictRefetch(): void {
    this.conflictRefetchListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("[MutationQueue] Conflict refetch error:", err);
      }
    });
  }

  private broadcastMessage(msg: string): void {
    this.lastUserMessage = msg;
    this.userMessageListeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error("[MutationQueue] Message listener error:", err);
      }
    });
  }

  async enqueue<B = unknown>(
    action: string,
    url: string,
    method: "POST" | "PATCH" | "PUT" | "DELETE",
    payload: B,
    idempotencyKey?: string
  ): Promise<string> {
    const key =
      idempotencyKey ||
      "idemp_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    try {
      const db = await this.getDb();
      if (db) {
        await db.runAsync(
          `INSERT OR REPLACE INTO mutation_queue 
           (action, url, method, payload, idempotency_key, created_at, status, retry_count)
           VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0)`,
          [action, url, method, payloadStr, key, createdAt]
        );
      } else {
        this.memoryQueue.push({
          id: this.memoryIdCounter++,
          action,
          url,
          method,
          payload: payloadStr,
          idempotency_key: key,
          created_at: createdAt,
          status: "PENDING",
          retry_count: 0,
        });
      }
    } catch (e) {
      console.error("[MutationQueue] Enqueue error:", e);
    }

    this.notify();
    return key;
  }

  async getPending(): Promise<QueuedMutation[]> {
    try {
      const db = await this.getDb();
      if (db) {
        const rows = await db.getAllAsync<QueuedMutation>(
          "SELECT * FROM mutation_queue WHERE status = 'PENDING' ORDER BY id ASC"
        );
        return rows;
      }
      return this.memoryQueue.filter((m) => m.status === "PENDING");
    } catch (e) {
      console.warn("[MutationQueue] Failed to query pending mutations:", e);
      return [];
    }
  }

  async getPendingCount(): Promise<number> {
    const items = await this.getPending();
    return items.length;
  }

  async replayAll(): Promise<{ replayed: number; dropped: number; failed: number }> {
    if (this.isProcessing) return { replayed: 0, dropped: 0, failed: 0 };
    this.isProcessing = true;
    let replayed = 0;
    let dropped = 0;
    let failed = 0;

    try {
      const pending = await this.getPending();
      for (const item of pending) {
        try {
          const body = item.payload ? JSON.parse(item.payload) : undefined;
          const opts = { idempotencyKey: item.idempotency_key };

          if (item.method === "POST") {
            await postRequest(item.url, body, opts);
          } else if (item.method === "PATCH") {
            await patchRequest(item.url, body, opts);
          } else if (item.method === "PUT") {
            await putRequest(item.url, body, opts);
          } else if (item.method === "DELETE") {
            await deleteRequest(item.url, body, opts);
          }

          await this.markCompleted(item.id);
          replayed++;
        } catch (err: unknown) {
          const status =
            (err as { status?: number })?.status ??
            (err as { statusCode?: number })?.statusCode;
          const message =
            err instanceof Error ? err.message : "Replay failure";

          // Rule: on 409 drop the item and refetch
          if (status === 409) {
            console.warn(
              `[MutationQueue] 409 Conflict for "${item.action}". Dropping item and triggering refetch.`
            );
            await this.markDropped(item.id, `Conflict (409): ${message}`);
            dropped++;
            this.triggerConflictRefetch();
            continue;
          }

          // Rule: on 403 drop and show a message
          if (status === 403) {
            console.warn(
              `[MutationQueue] 403 Forbidden for "${item.action}". Dropping item and alerting user.`
            );
            const userMsg = `Action "${item.action}" was rejected by the server: Permission denied (403).`;
            await this.markDropped(item.id, `Forbidden (403): ${message}`);
            dropped++;
            this.broadcastMessage(userMsg);
            continue;
          }

          // Rule: Never retry forever (drop after MAX_RETRIES)
          if (item.retry_count + 1 >= MAX_RETRIES) {
            console.warn(
              `[MutationQueue] Reached max retries (${MAX_RETRIES}) for "${item.action}". Dropping permanently.`
            );
            await this.markDropped(
              item.id,
              `Exceeded max retries (${MAX_RETRIES}): ${message}`
            );
            dropped++;
            this.broadcastMessage(
              `Offline action "${item.action}" failed permanently after ${MAX_RETRIES} attempts.`
            );
            continue;
          }

          // Transient error: mark failed and increment retry_count
          failed++;
          await this.markFailed(item.id, message);
        }
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }

    return { replayed, dropped, failed };
  }

  private async markCompleted(id: number): Promise<void> {
    const db = await this.getDb();
    if (db) {
      await db.runAsync("DELETE FROM mutation_queue WHERE id = ?", [id]);
    } else {
      this.memoryQueue = this.memoryQueue.filter((m) => m.id !== id);
    }
  }

  private async markDropped(id: number, reason: string): Promise<void> {
    console.log(`[MutationQueue] Mutation ${id} dropped: ${reason}`);
    const db = await this.getDb();
    if (db) {
      await db.runAsync("DELETE FROM mutation_queue WHERE id = ?", [id]);
    } else {
      this.memoryQueue = this.memoryQueue.filter((m) => m.id !== id);
    }
  }

  private async markFailed(id: number, errorMsg: string): Promise<void> {
    const db = await this.getDb();
    if (db) {
      await db.runAsync(
        "UPDATE mutation_queue SET status = 'PENDING', retry_count = retry_count + 1, error_message = ? WHERE id = ?",
        [errorMsg, id]
      );
    } else {
      const idx = this.memoryQueue.findIndex((m) => m.id === id);
      if (idx >= 0) {
        this.memoryQueue[idx].status = "PENDING";
        this.memoryQueue[idx].retry_count += 1;
        this.memoryQueue[idx].error_message = errorMsg;
      }
    }
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    if (db) {
      await db.runAsync("DELETE FROM mutation_queue");
    }
    this.memoryQueue = [];
    this.notify();
  }
}

export const mutationQueue = new MutationQueue();
