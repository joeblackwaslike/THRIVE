import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { APPLICATION_STATUSES } from '@/lib/constants';
import { notify } from '@/lib/notifications';
import { useApplicationsStore } from '@/stores';
import type { Application, ApplicationStatus } from '@/types';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';

export function KanbanBoard() {
  const { getFilteredApplications, updateApplication } = useApplicationsStore();
  const applications = getFilteredApplications();
  const [activeCard, setActiveCard] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Group applications by status and sort by sortOrder
  const applicationsByStatus = useMemo(() => {
    const grouped = new Map<ApplicationStatus, Application[]>();

    // Initialize all statuses with empty arrays
    for (const status of APPLICATION_STATUSES) {
      grouped.set(status.value, []);
    }

    // Group applications
    for (const app of applications) {
      const statusApps = grouped.get(app.status) || [];
      statusApps.push(app);
      grouped.set(app.status, statusApps);
    }

    // Sort each group by sortOrder (if present), then by updatedAt
    for (const apps of grouped.values()) {
      apps.sort((a, b) => {
        // If both have sortOrder, use that
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        // If only one has sortOrder, prioritize it
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        // Otherwise sort by updatedAt (newest first)
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return grouped;
  }, [applications]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const application = applications.find((app) => app.id === active.id);
    if (application) {
      setActiveCard(application);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveCard(null);
      return;
    }

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Find the dragged application
    const draggedApp = applications.find((app) => app.id === draggedId);
    if (!draggedApp) {
      setActiveCard(null);
      return;
    }

    // Check if we're dropping on a column (status change)
    const isDropOnColumn = APPLICATION_STATUSES.some((s) => s.value === overId);

    if (isDropOnColumn) {
      // Status change - dropping on column
      const newStatus = overId as ApplicationStatus;

      if (draggedApp.status !== newStatus) {
        updateApplication(draggedId, { status: newStatus });

        // Find the new status label for the toast
        const statusLabel =
          APPLICATION_STATUSES.find((s) => s.value === newStatus)?.label || newStatus;

        // Show status change notification (respects user preferences)
        notify.statusChange('Status Updated', `${draggedApp.position} moved to ${statusLabel}`);
      }
    } else {
      // Reordering within column - dropping on another card
      const overApp = applications.find((app) => app.id === overId);

      if (overApp && draggedApp.status === overApp.status && draggedId !== overId) {
        // Both apps are in the same column, reorder them
        const statusApps = applicationsByStatus.get(draggedApp.status) || [];
        const oldIndex = statusApps.findIndex((app) => app.id === draggedId);
        const newIndex = statusApps.findIndex((app) => app.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          // We'll use the array index as a simple sort order
          // In a real app, you might want to store this in the database
          const reorderedApps = arrayMove(statusApps, oldIndex, newIndex);

          // Update the sortOrder for all affected applications
          reorderedApps.forEach((app, index) => {
            updateApplication(app.id, { sortOrder: index });
          });

          notify.success('Reordered', `${draggedApp.position} position updated`);
        }
      }
    }

    setActiveCard(null);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {APPLICATION_STATUSES.map((status) => {
          const columnApplications = applicationsByStatus.get(status.value) || [];

          return (
            <SortableContext
              key={status.value}
              id={status.value}
              items={columnApplications.map((app) => app.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                status={status}
                applications={columnApplications}
                count={columnApplications.length}
              />
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeCard ? <KanbanCard application={activeCard} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
