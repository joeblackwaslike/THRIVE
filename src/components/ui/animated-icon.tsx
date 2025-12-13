import { type MotionProps, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedIconProps extends Omit<MotionProps, 'children'> {
  icon: LucideIcon;
  size?: number;
  className?: string;
  animation?: 'bounce' | 'rotate' | 'scale' | 'wiggle' | 'pulse' | 'none';
  triggerOnHover?: boolean;
}

/**
 * AnimatedIcon - Icon with smooth hover animations
 *
 * Wraps Lucide icons with Framer Motion animations for delightful micro-interactions.
 *
 * @example
 * ```tsx
 * <AnimatedIcon icon={Heart} animation="bounce" triggerOnHover />
 * <AnimatedIcon icon={Settings} animation="rotate" size={24} />
 * <AnimatedIcon icon={Bell} animation="wiggle" className="text-blue-500" />
 * ```
 */
export function AnimatedIcon({
  icon: Icon,
  size = 20,
  className,
  animation = 'scale',
  triggerOnHover = true,
  ...motionProps
}: AnimatedIconProps) {
  const animations = {
    bounce: {
      y: [0, -8, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    rotate: {
      rotate: [0, 360],
      transition: { duration: 0.6, ease: 'easeInOut' },
    },
    scale: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    wiggle: {
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
    pulse: {
      scale: [1, 1.15, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    none: {},
  };

  const hoverAnimation = triggerOnHover && animation !== 'none' ? animations[animation] : {};

  return (
    <motion.div
      className={cn('inline-flex items-center justify-center', className)}
      whileHover={hoverAnimation}
      {...motionProps}
    >
      <Icon size={size} />
    </motion.div>
  );
}

/**
 * AnimatedIconButton - Icon button with hover and tap animations
 *
 * Combines icon animations with button press effects.
 *
 * @example
 * ```tsx
 * <AnimatedIconButton
 *   icon={Trash2}
 *   onClick={handleDelete}
 *   animation="wiggle"
 * />
 * ```
 */
export function AnimatedIconButton({
  icon: Icon,
  size = 20,
  className,
  animation = 'scale',
  onClick,
  ...motionProps
}: AnimatedIconProps & { onClick?: () => void }) {
  const animations = {
    bounce: { y: [0, -8, 0] },
    rotate: { rotate: [0, 360] },
    scale: { scale: [1, 1.2, 1] },
    wiggle: { rotate: [0, -10, 10, -10, 0] },
    pulse: { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] },
    none: {},
  };

  return (
    <motion.button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      whileHover={animation !== 'none' ? animations[animation] : { scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...motionProps}
    >
      <Icon size={size} />
    </motion.button>
  );
}
