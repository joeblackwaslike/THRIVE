import * as Sentry from '@sentry/react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SentryEvent {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  tags: Record<string, string>;
  user?: {
    id?: string;
    email?: string;
  };
}

export function SentryMonitor() {
  const [events, setEvents] = useState<SentryEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SentryEvent | null>(null);

  useEffect(() => {
    // Check if Sentry is configured
    setIsConnected(!!import.meta.env.VITE_SENTRY_DSN);

    // Set up event listener for Sentry events
    Sentry.addEventProcessor((event) => {
      const sentryEvent: SentryEvent = {
        id: event.event_id || 'unknown',
        level: event.level || 'info',
        message: event.message || event.exception?.values?.[0]?.value || 'Unknown error',
        timestamp: new Date().toISOString(),
        tags: Object.fromEntries(
          Object.entries((event.tags || {}) as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ]),
        ),
        user: event.user
          ? {
              id:
                typeof event.user.id === 'number'
                  ? String(event.user.id)
                  : (event.user.id as string | undefined),
              email: event.user.email,
            }
          : undefined,
      };

      setLastEvent(sentryEvent);
      setEvents((prev) => [sentryEvent, ...prev.slice(0, 9)]);

      return event;
    });

    return () => {};
  }, []);

  const testError = () => {
    throw new Error('Test error from Sentry Monitor');
  };

  const testMessage = () => {
    Sentry.captureMessage('Test message from Sentry Monitor', 'info');
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-info" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variant =
      level === 'error' ? 'destructive' : level === 'warning' ? 'secondary' : 'default';
    return <Badge variant={variant}>{level.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Sentry Monitoring
            {isConnected ? (
              <Badge variant="secondary" className="ml-2">
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="ml-2">
                Not Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Real-time error monitoring and performance tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={testMessage} disabled={!isConnected}>
              Test Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testError}
              disabled={!isConnected}
              className="border-destructive text-destructive"
            >
              Test Error
            </Button>
          </div>

          {lastEvent && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getLevelIcon(lastEvent.level)}
                <span className="font-medium">Last Event</span>
                {getLevelBadge(lastEvent.level)}
              </div>
              <p className="text-sm text-muted-foreground">{lastEvent.message}</p>
              {lastEvent.user && (
                <p className="text-xs text-muted-foreground mt-1">
                  User: {lastEvent.user.email || lastEvent.user.id}
                </p>
              )}
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Events</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 p-2 bg-background rounded border"
                  >
                    {getLevelIcon(event.level)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {getLevelBadge(event.level)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Sentry is not configured</p>
              <p className="text-sm">Add VITE_SENTRY_DSN to your environment variables</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <span>
                {import.meta.env.VITE_SENTRY_ENVIRONMENT ||
                  import.meta.env.NODE_ENV ||
                  'development'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Release:</span>
              <span>{import.meta.env.VITE_APP_VERSION || '0.1.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DSN Configured:</span>
              <span>{import.meta.env.VITE_SENTRY_DSN ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
