import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatusChangeIndicatorProps {
  oldStatus?: string;
  newStatus: string;
  show: boolean;
  onComplete?: () => void;
  duration?: number;
}

/**
 * StatusChangeIndicator - Brief animation showing status change
 *
 * Displays a success indicator with old and new status when a status changes.
 * Automatically hides after duration.
 *
 * @example
 * ```tsx
 * <StatusChangeIndicator
 *   oldStatus="applied"
 *   newStatus="interviewing"
 *   show={true}
 *   onComplete={() => setShowIndicator(false)}
 * />
 * ```
 */
export function StatusChangeIndicator({
  oldStatus,
  newStatus,
  show,
  onComplete,
  duration = 2000,
}: StatusChangeIndicatorProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'fixed top-20 right-4 z-50',
            'flex items-center gap-3 p-4 rounded-lg shadow-lg',
            'bg-green-50 dark:bg-green-950/20 border-2 border-green-500',
          )}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </motion.div>

          <div className="flex items-center gap-2 text-sm">
            {oldStatus && (
              <>
                <span className="text-muted-foreground capitalize">
                  {oldStatus.replace('-', ' ')}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="font-semibold text-green-600 dark:text-green-400 capitalize"
            >
              {newStatus.replace('-', ' ')}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
