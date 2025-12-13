import { Link } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, Bell, CheckCheck, Clock, Timer as Snooze, X } from 'lucide-react';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import { useNotificationsStore } from '@/stores/notificationsStore';
import type { Notification, NotificationPriority } from '@/types/notifications';

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const TYPE_ICONS = {
  deadline: '⏰',
  'follow-up': '📧',
  interview: '🎯',
  'application-update': '📝',
  reminder: '🔔',
  general: 'ℹ️',
};

export function NotificationsList() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const dismissNotification = useNotificationsStore((state) => state.dismissNotification);
  const snoozeNotification = useNotificationsStore((state) => state.snoozeNotification);
  const settings = useNotificationsStore((state) => state.settings);

  const unreadScrollRef = useRef<HTMLDivElement>(null);
  const readScrollRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(
    (n) => n.status === 'sent' || n.status === 'pending',
  );

  const readNotifications = notifications
    .filter((n) => n.status !== 'sent' && n.status !== 'pending')
    .slice(0, 10);

  const unreadVirtualizer = useVirtualizer({
    count: unreadNotifications.length,
    getScrollElement: () => unreadScrollRef.current,
    estimateSize: () => 150,
    overscan: 3,
  });

  const readVirtualizer = useVirtualizer({
    count: readNotifications.length,
    getScrollElement: () => readScrollRef.current,
    estimateSize: () => 150,
    overscan: 3,
  });

  const handleSnooze = (id: string) => {
    snoozeNotification(id, settings.defaultSnoozeMinutes);
  };

  const renderNotification = (notification: Notification) => {
    const isUnread = notification.status === 'sent' || notification.status === 'pending';

    return (
      <Card key={notification.id} className={isUnread ? 'border-l-4 border-l-primary' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{TYPE_ICONS[notification.type]}</span>
                <CardTitle className="text-base">{notification.title}</CardTitle>
                {isUnread && (
                  <Badge variant="default" className="ml-2">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(notification.scheduledFor)}</span>
                <Badge
                  variant="outline"
                  className={`${PRIORITY_COLORS[notification.priority]} text-white border-0`}
                >
                  {notification.priority}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {notification.type.replace('-', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {isUnread && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(notification.id)}
                  title="Mark as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              {isUnread && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSnooze(notification.id)}
                  title={`Snooze for ${settings.defaultSnoozeMinutes} min`}
                >
                  <Snooze className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => dismissNotification(notification.id)}
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {notification.actionUrl && (
          <CardContent className="pt-0">
            <Link to={notification.actionUrl}>
              <Button variant="outline" size="sm">
                {notification.actionLabel || 'View Details'}
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    );
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            You'll see notifications here when there are updates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      {unreadNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadNotifications.length} unread notification
            {unreadNotifications.length > 1 ? 's' : ''}
          </p>
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Unread
          </h3>
          <div ref={unreadScrollRef} className="overflow-auto" style={{ maxHeight: '500px' }}>
            <div
              style={{
                height: `${unreadVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {unreadVirtualizer.getVirtualItems().map((virtualRow) => {
                const notification = unreadNotifications[virtualRow.index];
                return (
                  <div
                    key={notification.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: '12px',
                    }}
                  >
                    {renderNotification(notification)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Earlier</h3>
          <div ref={readScrollRef} className="overflow-auto" style={{ maxHeight: '500px' }}>
            <div
              style={{
                height: `${readVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {readVirtualizer.getVirtualItems().map((virtualRow) => {
                const notification = readNotifications[virtualRow.index];
                return (
                  <div
                    key={notification.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: '12px',
                    }}
                  >
                    {renderNotification(notification)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
