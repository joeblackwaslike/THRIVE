import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApplicationsStore } from '@/stores/applicationsStore';
import type { CustomWidget } from '@/stores/customWidgetsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';
import type { Application, Interview } from '@/types';

interface CustomWidgetRendererProps {
  widget: CustomWidget;
}

export function CustomWidgetRenderer({ widget }: CustomWidgetRendererProps) {
  const { applications } = useApplicationsStore();
  const { interviews } = useInterviewsStore();

  const data = useMemo(() => {
    const source = widget.dataSource === 'applications' ? applications : interviews;

    // Apply filters
    if (widget.filters.length === 0) {
      return source;
    }

    const filtered = source.filter((item) => {
      return widget.filters.every((filter) => {
        const record = item as unknown as Record<string, unknown>;
        const value = record[filter.field];

        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'notEquals':
            return value !== filter.value;
          case 'contains':
            return (
              typeof value === 'string' &&
              value.toLowerCase().includes((filter.value as string).toLowerCase())
            );
          case 'greaterThan':
            return typeof value === 'number' && value > Number(filter.value);
          case 'lessThan':
            return typeof value === 'number' && value < Number(filter.value);
          default:
            return true;
        }
      });
    });

    return filtered;
  }, [widget, applications, interviews]);

  const renderContent = () => {
    switch (widget.displayType) {
      case 'number':
        return (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{data.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {widget.dataSource === 'applications' ? 'Applications' : 'Interviews'}
              </p>
            </div>
          </div>
        );

      case 'list': {
        return (
          <div className="space-y-2">
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No matching {widget.dataSource} found
              </p>
            ) : (
              data.slice(0, 5).map((item: Application | Interview) => {
                const record = item as unknown as Record<string, unknown>;
                return (
                  <div
                    key={record.id as string}
                    className="flex items-center justify-between p-2 rounded border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {widget.dataSource === 'applications'
                          ? `${String(record.position)} at ${String(record.companyName)}`
                          : String(record.type)}
                      </p>
                      {typeof record.status === 'string' && record.status && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {record.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {data.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{data.length - 5} more
              </p>
            )}
          </div>
        );
      }

      case 'bar-chart': {
        // Group by status
        const statusCounts: Record<string, number> = data.reduce(
          (acc: Record<string, number>, item: Application | Interview) => {
            const record = item as unknown as Record<string, unknown>;
            const status = String(record.status) || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          },
          {},
        );

        const maxCount = Math.max(...Object.values(statusCounts).map(Number), 1);

        return (
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(Number(count) / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      }

      default:
        return (
          <p className="text-sm text-muted-foreground text-center py-8">
            Display type not yet implemented
          </p>
        );
    }
  };

  const getColorClass = () => {
    switch (widget.colorScheme) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-primary';
    }
  };

  return (
    <AnimatedCard hoverEffect="lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className={`h-5 w-5 ${getColorClass()}`} />
          {widget.title}
        </CardTitle>
        {widget.description && <CardDescription>{widget.description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </AnimatedCard>
  );
}
