/**
 * React hooks for database batching with TanStack Pacer
 *
 * Provides easy-to-use hooks for batching database operations in React components.
 */
import { useEffect, useRef } from 'react';
import type { BatcherConfig } from '@/lib/database-batching';
import { createDatabaseBatcher } from '@/lib/database-batching';

/**
 * Hook for batched database updates
 *
 * Automatically flushes pending updates when component unmounts.
 *
 * @example
 * ```tsx
 * function TagEditor({ applicationId }: Props) {
 *   const batcher = useDatabaseBatcher({
 *     table: db.applications,
 *     wait: 500,
 *     maxBatchSize: 10,
 *     onSuccess: (count) => toast.success(`Saved ${count} changes`),
 *   });
 *
 *   const handleTagChange = (tags: string[]) => {
 *     batcher.update(applicationId, { tags });
 *   };
 *
 *   return <TagInput onChange={handleTagChange} />;
 * }
 * ```
 */
export function useDatabaseBatcher<T>(config: BatcherConfig<T>) {
  const batcherRef = useRef(createDatabaseBatcher(config));

  // Flush on unmount
  useEffect(() => {
    return () => {
      batcherRef.current.flush();
    };
  }, []);

  return batcherRef.current;
}

/**
 * Hook for auto-save functionality with batching
 *
 * Automatically updates the database when a value changes.
 *
 * @example
 * ```tsx
 * function NotesEditor({ application }: Props) {
 *   const [notes, setNotes] = useState(application.notes);
 *
 *   useAutoSaveBatcher(
 *     db.applications,
 *     application.id,
 *     { notes },
 *     [notes] // Dependencies
 *   );
 *
 *   return <textarea value={notes} onChange={e => setNotes(e.target.value)} />;
 * }
 * ```
 */
export function useAutoSaveBatcher<T>(
  updater: (id: string, changes: Partial<T>) => Promise<any>,
  id: string,
  changes: Partial<T>,
  // biome-ignore lint/suspicious/noExplicitAny: Dependencies array needs to accept any types
  dependencies: any[],
  options?: {
    wait?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  },
) {
  const batcherRef = useRef(
    createDatabaseBatcher({
      update: updater,
      wait: options?.wait || 1000,
      maxBatchSize: 1, // Auto-save typically updates one item
      onSuccess: options?.onSuccess ? () => options.onSuccess?.() : undefined,
      onError: options?.onError,
    }),
  );

  useEffect(() => {
    if (!id) return;
    batcherRef.current.update(id, changes);
    // biome-ignore lint/correctness/useExhaustiveDependencies: Dependencies provided by caller
  }, dependencies);

  // Flush on unmount
  useEffect(() => {
    return () => {
      batcherRef.current.flush();
    };
  }, []);
}
