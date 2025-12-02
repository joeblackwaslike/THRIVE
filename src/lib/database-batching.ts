/**
 * Database Batching Utilities using TanStack Pacer
 *
 * Groups multiple database operations together for better performance.
 * Useful for rapid updates like tag editing, bulk imports, or form auto-save.
 */

import type { Table, UpdateSpec } from 'dexie';

/**
 * Configuration for a database batcher
 */
export interface BatcherConfig<T> {
  /** Dexie table to batch operations on */
  table: Table<T, string>;

  /** Wait time in ms before executing batch (default: 500ms) */
  wait?: number;

  /** Maximum batch size before forcing execution (default: 10) */
  maxBatchSize?: number;

  /** Callback for successful batch */
  onSuccess?: (count: number) => void;

  /** Callback for batch errors */
  onError?: (error: Error) => void;
}

/**
 * Create a batched database updater
 *
 * Collects multiple update operations and executes them together using bulkUpdate.
 * Automatically flushes after `wait` milliseconds or when `maxBatchSize` is reached.
 *
 * @example
 * ```ts
 * const batcher = createDatabaseBatcher({
 *   table: db.applications,
 *   wait: 500,
 *   maxBatchSize: 10,
 * });
 *
 * // These will be batched together
 * batcher.update('id1', { status: 'applied' });
 * batcher.update('id2', { status: 'interview' });
 * batcher.update('id3', { status: 'rejected' });
 *
 * // Batch is automatically flushed after 500ms or 10 items
 * ```
 */
export function createDatabaseBatcher<T>(config: BatcherConfig<T>) {
  const { table, wait = 500, maxBatchSize = 10, onSuccess, onError } = config;

  // Pending updates keyed by ID (later updates override earlier ones)
  const pendingUpdates = new Map<string, Partial<T>>();

  let flushTimer: NodeJS.Timeout | null = null;
  let isProcessing = false;

  /**
   * Execute the batched updates
   */
  const flush = async (): Promise<void> => {
    if (pendingUpdates.size === 0 || isProcessing) {
      return;
    }

    // Clear the timer
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    // Get all pending updates
    const updates = Array.from(pendingUpdates.entries())
      .filter(([id]) => !!id)
      .map(([id, changes]) => ({
        key: id,
        changes: { ...changes, updatedAt: new Date() } as UpdateSpec<T>,
      }));

    const count = updates.length;

    // Clear pending updates
    pendingUpdates.clear();
    isProcessing = true;

    try {
      // Execute updates individually to avoid Dexie bulkUpdate issues
      for (const u of updates) {
        await table.update(u.key as any, u.changes as any);
      }

      if (onSuccess) {
        onSuccess(count);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        console.error('Database batch update failed:', error);
      }
    } finally {
      isProcessing = false;
    }
  };

  /**
   * Schedule a flush if not already scheduled
   */
  const scheduleFlush = (): void => {
    if (flushTimer) {
      return;
    }

    flushTimer = setTimeout(() => {
      flush();
    }, wait);
  };

  /**
   * Add an update to the batch
   */
  const update = (id: string, changes: Partial<T>): void => {
    // Merge with existing pending update for this ID
    const existing = pendingUpdates.get(id);
    pendingUpdates.set(id, existing ? { ...existing, ...changes } : changes);

    // Check if we've reached max batch size
    if (pendingUpdates.size >= maxBatchSize) {
      flush();
    } else {
      scheduleFlush();
    }
  };

  /**
   * Force immediate flush of all pending updates
   */
  const forceFlush = (): Promise<void> => {
    return flush();
  };

  /**
   * Get the number of pending updates
   */
  const getPendingCount = (): number => {
    return pendingUpdates.size;
  };

  /**
   * Clear all pending updates without executing them
   */
  const clear = (): void => {
    pendingUpdates.clear();
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  return {
    update,
    flush: forceFlush,
    getPendingCount,
    clear,
  };
}

/**
 * Create a batched database adder for bulk inserts
 *
 * Similar to the updater but for adding new records.
 *
 * @example
 * ```ts
 * const batcher = createDatabaseAdder({
 *   table: db.applications,
 *   wait: 1000,
 *   maxBatchSize: 20,
 * });
 *
 * // Queue multiple adds
 * batcher.add({ id: 'id1', position: 'Engineer' });
 * batcher.add({ id: 'id2', position: 'Designer' });
 *
 * // Batch is automatically flushed
 * ```
 */
export function createDatabaseAdder<T>(config: BatcherConfig<T>) {
  const { table, wait = 1000, maxBatchSize = 20, onSuccess, onError } = config;

  const pendingAdds: T[] = [];
  let flushTimer: NodeJS.Timeout | null = null;
  let isProcessing = false;

  const flush = async (): Promise<void> => {
    if (pendingAdds.length === 0 || isProcessing) {
      return;
    }

    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    const items = [...pendingAdds];
    const count = items.length;

    pendingAdds.length = 0;
    isProcessing = true;

    try {
      await table.bulkAdd(items);

      if (onSuccess) {
        onSuccess(count);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        console.error('Database batch add failed:', error);
      }
    } finally {
      isProcessing = false;
    }
  };

  const scheduleFlush = (): void => {
    if (flushTimer) {
      return;
    }

    flushTimer = setTimeout(() => {
      flush();
    }, wait);
  };

  const add = (item: T): void => {
    pendingAdds.push(item);

    if (pendingAdds.length >= maxBatchSize) {
      flush();
    } else {
      scheduleFlush();
    }
  };

  return {
    add,
    flush,
    getPendingCount: () => pendingAdds.length,
    clear: () => {
      pendingAdds.length = 0;
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    },
  };
}
