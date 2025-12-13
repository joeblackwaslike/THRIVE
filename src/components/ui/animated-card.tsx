import { motion } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none';
  animateOnMount?: boolean;
  delay?: number;
}

/**
 * AnimatedCard - Card component with hover and mount animations
 *
 * @example
 * ```tsx
 * <AnimatedCard hoverEffect="lift">
 *   <CardHeader>...</CardHeader>
 * </AnimatedCard>
 *
 * <AnimatedCard hoverEffect="glow" animateOnMount delay={0.2}>
 *   <CardContent>...</CardContent>
 * </AnimatedCard>
 * ```
 */
const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    { children, className, hoverEffect = 'lift', animateOnMount = true, delay = 0, ...props },
    ref,
  ) => {
    const hoverVariants = {
      lift: {
        y: -8,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      glow: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
      scale: { scale: 1.02 },
      none: {},
    };

    const mountVariants = animateOnMount
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        initial={animateOnMount ? 'initial' : undefined}
        animate={animateOnMount ? 'animate' : undefined}
        variants={mountVariants || undefined}
        transition={{
          duration: 0.4,
          delay,
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        whileHover={hoverEffect !== 'none' ? hoverVariants[hoverEffect] : undefined}
        className={cn('transition-shadow', className)}
      >
        <Card {...props}>{children}</Card>
      </motion.div>
    );
  },
);

AnimatedCard.displayName = 'AnimatedCard';

export { AnimatedCard };
