import { format } from 'date-fns';
import { Reorder } from 'framer-motion';
import { Calendar, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AnimatedIconButton } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DraggableListItem } from '@/components/ui/draggable-list';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type AnnotationType, useAnnotationsStore } from '@/stores/annotationsStore';
import { AnnotationDialog } from './AnnotationDialog';

const ANNOTATION_TYPE_ICONS: Record<AnnotationType, string> = {
  milestone: '🎯',
  note: '📝',
  reminder: '⏰',
  event: '🎉',
};

const ANNOTATION_TYPE_LABELS: Record<AnnotationType, string> = {
  milestone: 'Milestone',
  note: 'Note',
  reminder: 'Reminder',
  event: 'Event',
};

export function AnnotationsList() {
  const { annotations, deleteAnnotation } = useAnnotationsStore();
  const [filterType, setFilterType] = useState<AnnotationType | 'all'>('all');
  const [enableReorder, setEnableReorder] = useState(false);

  const filteredAnnotations =
    filterType === 'all' ? annotations : annotations.filter((a) => a.type === filterType);

  const [localAnnotations, setLocalAnnotations] = useState(filteredAnnotations);

  // Keep local state in sync with store
  useState(() => {
    const sorted = [...filteredAnnotations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setLocalAnnotations(sorted);
  });

  const sortedAnnotations = enableReorder
    ? localAnnotations
    : [...filteredAnnotations].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

  const handleDelete = (id: string, title: string) => {
    deleteAnnotation(id);
    toast.success(`Deleted "${title}"`);
  };

  if (annotations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Annotations</CardTitle>
              <CardDescription>Mark important dates and events</CardDescription>
            </div>
            <AnnotationDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mb-4 opacity-20 mx-auto" />
            <p className="text-sm text-muted-foreground mb-4">
              No annotations yet. Add notes, milestones, or reminders to track important moments.
            </p>
            <AnnotationDialog trigger={<Button>Add First Annotation</Button>} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Annotations ({annotations.length})</CardTitle>
            <CardDescription>Your notes, milestones, and reminders</CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={enableReorder ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEnableReorder(!enableReorder)}
              className="gap-2"
            >
              {enableReorder ? '✓ Reordering' : 'Reorder'}
            </Button>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="h-7 px-2 text-xs"
              >
                All
              </Button>
              <Button
                variant={filterType === 'milestone' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('milestone')}
                className="h-7 px-2 text-xs"
              >
                🎯
              </Button>
              <Button
                variant={filterType === 'note' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('note')}
                className="h-7 px-2 text-xs"
              >
                📝
              </Button>
              <Button
                variant={filterType === 'reminder' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('reminder')}
                className="h-7 px-2 text-xs"
              >
                ⏰
              </Button>
              <Button
                variant={filterType === 'event' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('event')}
                className="h-7 px-2 text-xs"
              >
                🎉
              </Button>
            </div>
            <AnnotationDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedAnnotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No annotations match the selected filter.</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={sortedAnnotations}
            onReorder={setLocalAnnotations}
            className="space-y-3"
          >
            {sortedAnnotations.map((annotation) => (
              <DraggableListItem
                key={annotation.id}
                item={annotation}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                showDragHandle={enableReorder}
              >
                <div
                  className="flex items-start gap-3"
                  style={{ borderLeftWidth: '3px', borderLeftColor: annotation.color }}
                >
                  <div className="text-2xl flex-shrink-0">
                    {ANNOTATION_TYPE_ICONS[annotation.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{annotation.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(annotation.date), 'MMM dd, yyyy')} ·{' '}
                          {ANNOTATION_TYPE_LABELS[annotation.type]}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AnimatedIconButton
                            icon={MoreVertical}
                            size={16}
                            animation="rotate"
                            className="h-8 w-8"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(annotation.id, annotation.title)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {annotation.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {annotation.description}
                      </p>
                    )}
                    {annotation.tags && annotation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {annotation.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DraggableListItem>
            ))}
          </Reorder.Group>
        )}
      </CardContent>
    </Card>
  );
}
