/**
 * Database batching utilities
 */

/**
 * Configuration for a database batcher
 */
export interface BatcherConfig<T> {
  update: (id: string, changes: Partial<T>) => Promise<any>;
  wait?: number;
  maxBatchSize?: number;
  onSuccess?: (count: number) => void;
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
  const { update: updater, wait = 500, maxBatchSize = 10, onSuccess, onError } = config;

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
      .map(([id, changes]) => ({ key: id, changes: { ...changes, updatedAt: new Date() } }));

    const count = updates.length;

    // Clear pending updates
    pendingUpdates.clear();
    isProcessing = true;

    try {
      for (const u of updates) {
        await updater(u.key, u.changes as Partial<T>);
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
