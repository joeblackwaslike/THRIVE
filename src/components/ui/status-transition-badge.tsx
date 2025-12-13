import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Gift,
  type LucideIcon,
  MessageSquare,
  Search,
  Target,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Application } from '@/types';

interface StatusTransitionBadgeProps {
  status: Application['status'];
  className?: string;
  showIcon?: boolean;
  showPulse?: boolean;
}

// Status icon mapping
const STATUS_ICONS: Record<Application['status'], LucideIcon> = {
  target: Target,
  hunting: Search,
  applied: FileText,
  interviewing: MessageSquare,
  offer: Gift,
  accepted: CheckCircle,
  rejected: XCircle,
  withdrawn: ArrowLeft,
};

// Status display names
const STATUS_LABELS: Record<Application['status'], string> = {
  target: 'Target',
  hunting: 'Hunting',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

// Status colors with smooth transitions
const STATUS_COLORS: Record<Application['status'], { bg: string; text: string; border: string }> = {
  target: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  hunting: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  },
  applied: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-600',
  },
  interviewing: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  },
  offer: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-600',
  },
  accepted: {
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-600',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-600',
  },
  withdrawn: {
    bg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-600',
  },
};

/**
 * StatusTransitionBadge - Enhanced status badge with icon animations and color morphing
 *
 * Features:
 * - Smooth color transitions between status changes
 * - Icon animations (rotate, bounce, scale)
 * - Status-specific icons from Lucide
 * - Optional pulse effect on status change
 * - Flip animation for dramatic transitions
 *
 * @example
 * ```tsx
 * <StatusTransitionBadge status={application.status} showIcon />
 * <StatusTransitionBadge status={application.status} showIcon showPulse />
 * ```
 */
export function StatusTransitionBadge({
  status,
  className,
  showIcon = true,
  showPulse = false,
}: StatusTransitionBadgeProps) {
  const Icon = STATUS_ICONS[status];
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  // Different animation variants for different status types
  const getIconAnimation = (statusType: Application['status']) => {
    if (statusType === 'offer' || statusType === 'accepted') {
      // Celebratory bounce for positive outcomes
      return {
        rotate: [0, -10, 10, -5, 5, 0],
        scale: [1, 1.2, 1.1, 1.15, 1],
      };
    }
    if (statusType === 'rejected' || statusType === 'withdrawn') {
      // Subtle shake for negative outcomes
      return {
        x: [0, -3, 3, -2, 2, 0],
        opacity: [1, 0.8, 1],
      };
    }
    if (statusType === 'interviewing') {
      // Pulse for active status
      return {
        scale: [1, 1.15, 1],
      };
    }
    // Default smooth scale
    return {
      scale: [0.8, 1.1, 1],
    };
  };

  const getBadgeAnimation = (statusType: Application['status']) => {
    // Special flip animation for major status changes
    if (statusType === 'offer' || statusType === 'rejected') {
      return {
        rotateY: [90, 0],
        scale: [0.8, 1.05, 1],
      };
    }
    // Default fade and scale
    return {
      opacity: [0, 1],
      scale: [0.9, 1.02, 1],
    };
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={getBadgeAnimation(status)}
        animate={{
          opacity: 1,
          scale: 1,
          rotateY: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          transition: { duration: 0.15 },
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
        }}
        className="inline-flex"
      >
        <motion.div
          animate={
            showPulse
              ? {
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    '0 0 0 0px rgba(0, 0, 0, 0)',
                    '0 0 0 4px rgba(0, 0, 0, 0.1)',
                    '0 0 0 0px rgba(0, 0, 0, 0)',
                  ],
                }
              : {}
          }
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
        >
          <Badge
            variant="outline"
            className={cn(
              'transition-all duration-500 ease-in-out',
              'border-2',
              colors.bg,
              colors.text,
              colors.border,
              className,
            )}
          >
            <span className="flex items-center gap-1.5">
              {showIcon && (
                <motion.span
                  key={`icon-${status}`}
                  initial={getIconAnimation(status)}
                  animate={{
                    rotate: 0,
                    scale: 1,
                    x: 0,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    ease: 'easeOut',
                  }}
                  className="inline-flex"
                >
                  <Icon size={14} />
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {label}
              </motion.span>
            </span>
          </Badge>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
