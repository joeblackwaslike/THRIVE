import { Clock, Eye, EyeOff, LayoutGrid, Trash2, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useCustomWidgetsStore } from '@/stores/customWidgetsStore';
import { type DashboardWidgetType, useDashboardStore } from '@/stores/dashboardStore';
import { CustomWidgetBuilder } from './CustomWidgetBuilder';

// Mini preview component for each widget type
const WidgetPreview = ({ type }: { type: DashboardWidgetType }) => {
  const baseClass = 'w-full h-16 rounded border bg-card p-2 flex items-center justify-center';

  switch (type) {
    case 'stats':
      return (
        <div className={baseClass}>
          <div className="flex gap-1 w-full h-full items-end justify-around">
            <div className="w-2 bg-primary/30 h-[30%] rounded-sm" />
            <div className="w-2 bg-primary/50 h-[60%] rounded-sm" />
            <div className="w-2 bg-primary/70 h-[45%] rounded-sm" />
            <div className="w-2 bg-primary h-[80%] rounded-sm" />
          </div>
        </div>
      );

    case 'funnel':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-1 w-full items-center">
            <div className="w-[90%] h-2 bg-primary/70 rounded-sm" />
            <div className="w-[70%] h-2 bg-primary/50 rounded-sm" />
            <div className="w-[50%] h-2 bg-primary/30 rounded-sm" />
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <div className="flex-1 h-1 bg-primary/30 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-primary/50" />
              <div className="flex-1 h-1 bg-primary/20 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-primary/30" />
              <div className="flex-1 h-1 bg-primary/10 rounded-sm" />
            </div>
          </div>
        </div>
      );

    case 'status-distribution':
      return (
        <div className={baseClass}>
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div
              className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent border-l-transparent"
              style={{ transform: 'rotate(-45deg)' }}
            />
          </div>
        </div>
      );

    case 'response-metrics':
      return (
        <div className={baseClass}>
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full" aria-label="Response metrics gauge">
              <title>Response metrics gauge</title>
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/20"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="75, 100"
                className="text-primary"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
          </div>
        </div>
      );

    case 'quick-actions':
      return (
        <div className={baseClass}>
          <div className="grid grid-cols-2 gap-1 w-full h-full p-1">
            <div className="bg-primary/30 rounded-sm flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <div className="bg-primary/20 rounded-sm" />
            <div className="bg-primary/20 rounded-sm" />
            <div className="bg-primary/20 rounded-sm" />
          </div>
        </div>
      );

    case 'recent-activity':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-1">
              <Clock className="h-2 w-2 text-primary" />
              <div className="flex-1 h-1 bg-primary/30 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-2 w-2 text-primary/50" />
              <div className="flex-1 h-1 bg-primary/20 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-2 w-2 text-primary/30" />
              <div className="flex-1 h-1 bg-primary/10 rounded-sm" />
            </div>
          </div>
        </div>
      );

    case 'upcoming-interviews':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-1 p-1 bg-primary/20 rounded">
              <div className="w-1.5 h-1.5 rounded-sm bg-primary" />
              <div className="flex-1 h-0.5 bg-primary/40 rounded-sm" />
            </div>
            <div className="flex items-center gap-1 p-1 bg-primary/10 rounded">
              <div className="w-1.5 h-1.5 rounded-sm bg-primary/60" />
              <div className="flex-1 h-0.5 bg-primary/30 rounded-sm" />
            </div>
          </div>
        </div>
      );

    case 'application-goals':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-1 w-full items-center justify-center">
            <div className="text-[10px] font-bold text-primary">12/20</div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-primary rounded-full" />
            </div>
          </div>
        </div>
      );

    case 'company-insights':
      return (
        <div className={baseClass}>
          <div className="grid grid-cols-3 gap-1 w-full h-full p-1">
            <div className="bg-primary/30 rounded flex items-center justify-center text-[8px] font-bold text-primary">
              A
            </div>
            <div className="bg-primary/20 rounded flex items-center justify-center text-[8px] font-bold text-primary/70">
              B
            </div>
            <div className="bg-primary/30 rounded flex items-center justify-center text-[8px] font-bold text-primary">
              C
            </div>
            <div className="bg-primary/20 rounded flex items-center justify-center text-[8px] font-bold text-primary/70">
              D
            </div>
            <div className="bg-primary/30 rounded flex items-center justify-center text-[8px] font-bold text-primary">
              E
            </div>
            <div className="bg-primary/20 rounded flex items-center justify-center text-[8px] font-bold text-primary/70">
              F
            </div>
          </div>
        </div>
      );

    case 'salary-tracker':
      return (
        <div className={baseClass}>
          <div className="flex flex-col gap-0.5 w-full items-center justify-center">
            <div className="text-[8px] text-primary font-bold">$120K</div>
            <div className="w-full flex items-end justify-around h-8 gap-1">
              <div className="w-2 bg-primary/40 h-[40%] rounded-t" />
              <div className="w-2 bg-primary/60 h-[60%] rounded-t" />
              <div className="w-2 bg-primary h-[80%] rounded-t" />
              <div className="w-2 bg-primary/60 h-[50%] rounded-t" />
            </div>
          </div>
        </div>
      );

    case 'networking-tracker':
      return (
        <div className={baseClass}>
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-8 h-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60" />
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/80" />
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className={baseClass}>
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
        </div>
      );
  }
};

export function DashboardCustomizer() {
  const { widgets, toggleWidget, resetToDefault } = useDashboardStore();
  const {
    widgets: customWidgets,
    toggleWidget: toggleCustomWidget,
    deleteWidget,
  } = useCustomWidgetsStore();

  const visibleCount =
    widgets.filter((w) => w.visible).length + customWidgets.filter((w) => w.visible).length;

  return (
    <div className="flex gap-2">
      <CustomWidgetBuilder />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Customize Layout
            <Badge variant="secondary" className="ml-2">
              {visibleCount}
            </Badge>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Dashboard Widgets</SheetTitle>
            <SheetDescription>
              Toggle widgets on or off to customize your dashboard view
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Widget Grid */}
          <div className="flex-1 overflow-y-auto mt-6 space-y-6">
            {/* Built-in Widgets */}
            <div>
              <h3 className="text-sm font-medium mb-3">Built-in Widgets</h3>
              <div className="grid grid-cols-2 gap-3 pr-2">
                {widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget) => (
                    <button
                      key={widget.id}
                      type="button"
                      onClick={() => toggleWidget(widget.id)}
                      className={cn(
                        'relative group rounded-lg border-2 transition-all p-3 text-left cursor-pointer hover:border-primary/50',
                        widget.visible
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-accent',
                      )}
                    >
                      {/* Visibility indicator */}
                      <div className="absolute top-2 right-2">
                        {widget.visible ? (
                          <Eye className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>

                      {/* Widget Preview */}
                      <div className="mb-2">
                        <WidgetPreview type={widget.id} />
                      </div>

                      {/* Widget Info */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium leading-tight">{widget.title}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                          {widget.description}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom Widgets */}
            {customWidgets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Custom Widgets</h3>
                <div className="grid grid-cols-2 gap-3 pr-2">
                  {customWidgets
                    .sort((a, b) => a.order - b.order)
                    .map((widget) => (
                      <button
                        key={widget.id}
                        type="button"
                        onClick={() => toggleCustomWidget(widget.id)}
                        className={cn(
                          'relative group rounded-lg border-2 transition-all p-3 text-left cursor-pointer hover:border-primary/50',
                          widget.visible
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:bg-accent',
                        )}
                      >
                        {/* Visibility indicator */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {widget.visible ? (
                            <Eye className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWidget(widget.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive hover:text-destructive/80" />
                          </button>
                        </div>

                        {/* Widget Preview - simple placeholder */}
                        <div className="mb-2 w-full h-16 rounded border bg-card p-2 flex items-center justify-center">
                          <div className="text-2xl font-bold text-primary/30">
                            {widget.displayType === 'number' && '123'}
                            {widget.displayType === 'list' && '≡'}
                            {widget.displayType === 'bar-chart' && '▂▄▆█'}
                          </div>
                        </div>

                        {/* Widget Info */}
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium leading-tight">{widget.title}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                            {widget.description}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                resetToDefault();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
