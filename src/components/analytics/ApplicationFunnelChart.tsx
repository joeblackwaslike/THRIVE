import { isWithinInterval } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApplicationsStore } from '@/stores/applicationsStore';
import type { Application } from '@/types';

const STAGE_COLORS: Record<string, string> = {
  applied: '#3b82f6', // blue
  screening: '#8b5cf6', // purple
  interviewing: '#f59e0b', // amber
  offer: '#10b981', // green
  rejected: '#ef4444', // red
  accepted: '#059669', // emerald
  declined: '#6b7280', // gray
  withdrawn: '#64748b', // slate
};

const STAGE_ORDER = [
  'applied',
  'screening',
  'interviewing',
  'offer',
  'accepted',
  'rejected',
  'declined',
  'withdrawn',
];

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offer: 'Offer Received',
  accepted: 'Accepted',
  rejected: 'Rejected',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

interface TooltipPayload {
  payload: {
    status: string;
    label: string;
    count: number;
    color: string;
    total: number;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = data.total > 0 ? ((data.count / data.total) * 100).toFixed(1) : '0';

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.label}</p>
        <p className="text-sm text-muted-foreground">
          {data.count} application{data.count !== 1 ? 's' : ''} ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

interface ApplicationFunnelChartProps {
  period?: {
    start: Date;
    end: Date;
  };
}

export function ApplicationFunnelChart({ period }: ApplicationFunnelChartProps = {}) {
  const { applications } = useApplicationsStore();
  const [drillDownData, setDrillDownData] = useState<{
    title: string;
    applications: Application[];
  } | null>(null);

  // Filter applications by period if provided
  const filteredApplications = useMemo(() => {
    if (!period) return applications;

    return applications.filter((app) => {
      const appDate = new Date(app.appliedDate || app.createdAt);
      return isWithinInterval(appDate, { start: period.start, end: period.end });
    });
  }, [applications, period]);

  const totalApplications = filteredApplications.length;

  const funnelData = useMemo(() => {
    // Count applications by status
    const statusCounts = filteredApplications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Create data in funnel order
    return STAGE_ORDER.map((status) => ({
      status,
      label: STAGE_LABELS[status],
      count: statusCounts[status] || 0,
      color: STAGE_COLORS[status],
      total: totalApplications,
      applications: filteredApplications.filter((app) => app.status === status),
    })).filter((item) => item.count > 0); // Only show stages with data
  }, [filteredApplications, totalApplications]);

  const handleBarClick = (data: unknown) => {
    const stage = data as { applications?: Application[]; label?: string };
    if (stage.applications && stage.applications.length > 0) {
      setDrillDownData({
        title: `${stage.label} Applications`,
        applications: stage.applications,
      });
    }
  };

  if (filteredApplications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>Track your application progress through stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No application data yet. Start adding applications to see your funnel!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Funnel</CardTitle>
        <CardDescription>
          Progression of {totalApplications} application{totalApplications !== 1 ? 's' : ''} through
          stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-xs text-muted-foreground">
          💡 Click on any bar to view applications in that stage
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={handleBarClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" />
            <YAxis dataKey="label" type="category" className="text-xs" width={100} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry) => (
                <Cell key={entry.status} fill={entry.color} style={{ cursor: 'pointer' }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {funnelData.map((item) => (
            <button
              key={item.status}
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => handleBarClick(item)}
            >
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted-foreground">
                {item.label} ({item.count})
              </span>
            </button>
          ))}
        </div>
      </CardContent>

      {/* Drill-Down Dialog */}
      <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{drillDownData?.title}</DialogTitle>
            <DialogDescription>
              {drillDownData?.applications.length} application
              {drillDownData?.applications.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {drillDownData?.applications.map((app) => (
              <div
                key={app.id}
                className="p-3 border-b last:border-b-0 hover:bg-muted/50 rounded transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{app.companyName}</p>
                    <p className="text-sm text-muted-foreground truncate">{app.position}</p>
                    {app.appliedDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${
                      app.status === 'offer'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : app.status === 'interviewing'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                          : app.status === 'rejected'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
