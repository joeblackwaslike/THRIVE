import { formatDistanceToNow } from 'date-fns';
import {
  Activity as ActivityIcon,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  StickyNote,
  Tag,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useActivityStore } from '@/stores/activityStore';
import type { Activity, ActivityType } from '@/types/activity';
import { ACTIVITY_LABELS } from '@/types/activity';

interface ActivityTimelineProps {
  entityId?: string;
  entityType?: Activity['entityType'];
  limit?: number;
  className?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, typeof FileText> = {
  created: FileText,
  updated: FileText,
  status_changed: CheckCircle,
  interview_scheduled: Calendar,
  interview_completed: CheckCircle,
  note_added: StickyNote,
  document_uploaded: Upload,
  contact_added: Users,
  deadline_set: Clock,
  follow_up_set: Clock,
  tag_added: Tag,
  tag_removed: XCircle,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  created: 'bg-blue-500',
  updated: 'bg-gray-500',
  status_changed: 'bg-purple-500',
  interview_scheduled: 'bg-green-500',
  interview_completed: 'bg-green-600',
  note_added: 'bg-yellow-500',
  document_uploaded: 'bg-indigo-500',
  contact_added: 'bg-pink-500',
  deadline_set: 'bg-orange-500',
  follow_up_set: 'bg-orange-400',
  tag_added: 'bg-teal-500',
  tag_removed: 'bg-red-500',
};

export function ActivityTimeline({
  entityId,
  entityType,
  limit = 50,
  className,
}: ActivityTimelineProps) {
  const getActivitiesByEntity = useActivityStore((state) => state.getActivitiesByEntity);
  const getRecentActivities = useActivityStore((state) => state.getRecentActivities);

  const activities = entityId
    ? getActivitiesByEntity(entityId, entityType)
    : getRecentActivities(limit);

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-sm text-muted-foreground', className)}>
        <ActivityIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map((activity, index) => {
        const Icon = ACTIVITY_ICONS[activity.type];
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-3 pb-2">
            {/* Timeline line */}
            {!isLast && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                ACTIVITY_COLORS[activity.type],
              )}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {ACTIVITY_LABELS[activity.type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-1">{activity.description}</p>
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
