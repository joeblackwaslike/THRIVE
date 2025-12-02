import { createFileRoute } from '@tanstack/react-router';
import { SentryMonitor } from '@/components/monitoring/SentryMonitor';

export const Route = createFileRoute('/monitoring')({
  component: MonitoringPage,
});

function MonitoringPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Monitoring & Analytics</h1>
        <p className="text-muted-foreground">
          Monitor application health, errors, and performance metrics
        </p>
      </div>

      <SentryMonitor />
    </div>
  );
}
