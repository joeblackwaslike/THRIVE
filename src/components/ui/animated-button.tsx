import type { VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';
import { forwardRef } from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';

interface AnimatedButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  scaleOnHover?: boolean;
  scaleOnTap?: boolean;
  asChild?: boolean;
}

/**
 * AnimatedButton - Button with smooth hover, tap, and loading animations
 *
 * Extends the standard Button component with Framer Motion animations.
 *
 * @example
 * ```tsx
 * <AnimatedButton onClick={handleClick}>
 *   Click Me
 * </AnimatedButton>
 *
 * <AnimatedButton loading loadingText="Saving...">
 *   Save
 * </AnimatedButton>
 * ```
 */
const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      scaleOnHover = true,
      scaleOnTap = true,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div
        whileHover={!disabled && !loading && scaleOnHover ? { scale: 1.05 } : undefined}
        whileTap={!disabled && !loading && scaleOnTap ? { scale: 0.95 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Button ref={ref} disabled={disabled || loading} {...props}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText || children}
            </>
          ) : (
            children
          )}
        </Button>
      </motion.div>
    );
  },
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
