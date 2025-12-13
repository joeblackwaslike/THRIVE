import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnimatedNumber, usePulse } from '@/hooks/useAnimations';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
  delay?: number;
  enableAnimation?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  delay = 0,
  enableAnimation = true,
}: StatCardProps) {
  // Animate numeric values
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string);
  const animatedValue = useAnimatedNumber(
    !Number.isNaN(numericValue) && enableAnimation ? numericValue : 0,
    600,
  );

  // Pulse animation when value changes
  const isPulsing = usePulse(value, 1000);

  // Format the displayed value
  const displayValue =
    typeof value === 'number' && enableAnimation && !Number.isNaN(numericValue)
      ? Math.round(animatedValue)
      : value;
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'text-green-600 dark:text-green-400';
    if (trend.direction === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <AnimatedCard
      hoverEffect="lift"
      animateOnMount
      delay={delay}
      className={cn(
        className,
        isPulsing &&
          enableAnimation &&
          'ring-2 ring-primary/20 ring-offset-2 transition-all duration-500',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold transition-all duration-300',
            isPulsing && enableAnimation && 'scale-110',
          )}
        >
          {displayValue}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs mt-2', getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">
              {trend.value > 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
}

/**
 * Grid layout for metric cards
 */
export function MetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
  );
}
