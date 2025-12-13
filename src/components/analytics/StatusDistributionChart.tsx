import { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
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

type ChartType = 'status' | 'priority';

const STATUS_COLORS: Record<string, string> = {
  applied: '#3b82f6', // blue
  screening: '#8b5cf6', // purple
  interviewing: '#f59e0b', // amber
  offer: '#10b981', // green
  rejected: '#ef4444', // red
  accepted: '#059669', // emerald
  declined: '#6b7280', // gray
  withdrawn: '#64748b', // slate
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280', // gray
  medium: '#3b82f6', // blue
  high: '#f59e0b', // amber
  urgent: '#ef4444', // red
};

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface TooltipPayload {
  payload: {
    name: string;
    value: number;
    percentage: string;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} application{data.value !== 1 ? 's' : ''} ({data.percentage})
        </p>
      </div>
    );
  }
  return null;
}

export function StatusDistributionChart() {
  const { applications } = useApplicationsStore();
  const [chartType, setChartType] = useState<ChartType>('status');
  const [drillDownData, setDrillDownData] = useState<{
    title: string;
    applications: Application[];
  } | null>(null);

  const chartData = useMemo(() => {
    const total = applications.length;

    if (chartType === 'status') {
      // Group by status
      const statusCounts = applications.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        percentage: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
        color: STATUS_COLORS[status] || '#6b7280',
        rawStatus: status,
        applications: applications.filter((app) => app.status === status),
      }));
    } else {
      // Group by priority
      const priorityCounts = applications.reduce(
        (acc, app) => {
          const priority = app.priority || 'medium';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(priorityCounts).map(([priority, count]) => ({
        name: PRIORITY_LABELS[priority] || priority,
        value: count,
        percentage: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
        color: PRIORITY_COLORS[priority] || '#6b7280',
        rawStatus: priority,
        applications: applications.filter((app) => (app.priority || 'medium') === priority),
      }));
    }
  }, [applications, chartType]);

  const handlePieClick = (data: unknown) => {
    const segment = data as { applications?: Application[]; name?: string };
    if (segment.applications && segment.applications.length > 0) {
      setDrillDownData({
        title: `${segment.name} Applications`,
        applications: segment.applications,
      });
    }
  };

  const totalApplications = applications.length;

  if (totalApplications === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution</CardTitle>
          <CardDescription>Application breakdown by status and priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No application data yet. Start adding applications to see the distribution!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Recharts label props are complex
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is > 5%
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>
              Breakdown of {totalApplications} application{totalApplications !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={chartType === 'status' ? 'default' : 'outline'}
              onClick={() => setChartType('status')}
            >
              Status
            </Button>
            <Button
              size="sm"
              variant={chartType === 'priority' ? 'default' : 'outline'}
              onClick={() => setChartType('priority')}
            >
              Priority
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-xs text-muted-foreground">
          💡 Click on any segment to view applications
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} style={{ cursor: 'pointer' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '14px', cursor: 'pointer' }}
              onClick={(e) => {
                const segment = chartData.find((item) => item.name === e.value);
                if (segment) {
                  handlePieClick(segment);
                }
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            {chartData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.value} ({item.percentage})
                  </p>
                </div>
              </div>
            ))}
          </div>
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
