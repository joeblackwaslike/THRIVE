import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardWidgetWrapperProps {
  id: string;
  children: ReactNode;
}

export function DashboardWidgetWrapper({ id, children }: DashboardWidgetWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group transition-all',
        isDragging && 'opacity-30',
        isOver && 'border-2 border-dashed border-primary rounded-lg scale-[1.02]',
      )}
    >
      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none z-0" />
      )}

      {/* Drag handle - only this is draggable */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Widget content - fully interactive */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
