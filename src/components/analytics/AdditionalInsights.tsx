import { isWithinInterval } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Target, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  calculateAvgTimeToOffer,
  calculateDayOfWeekPerformance,
  calculateSourcePerformance,
  formatNumber,
} from '@/lib/analytics';
import { useApplicationsStore } from '@/stores/applicationsStore';

interface AdditionalInsightsProps {
  period?: {
    start: Date;
    end: Date;
  };
}

export function AdditionalInsights({ period }: AdditionalInsightsProps = {}) {
  const { applications } = useApplicationsStore();

  // Filter applications by period if provided
  const filteredApplications = useMemo(() => {
    if (!period) return applications;

    return applications.filter((app) => {
      const appDate = new Date(app.appliedDate || app.createdAt);
      return isWithinInterval(appDate, { start: period.start, end: period.end });
    });
  }, [applications, period]);

  const avgTimeToOffer = useMemo(
    () => calculateAvgTimeToOffer(filteredApplications),
    [filteredApplications],
  );

  const sourcePerformance = useMemo(
    () => calculateSourcePerformance(filteredApplications),
    [filteredApplications],
  );

  const dayOfWeekPerformance = useMemo(
    () => calculateDayOfWeekPerformance(filteredApplications),
    [filteredApplications],
  );

  const bestSource = sourcePerformance.length > 0 ? sourcePerformance[0] : null;
  const bestDay =
    dayOfWeekPerformance.length > 0
      ? dayOfWeekPerformance.reduce((best, current) =>
          current.successRate > best.successRate ? current : best,
        )
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Average Time to Offer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Time to Offer</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgTimeToOffer > 0 ? `${Math.round(avgTimeToOffer)}d` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">From application to offer</p>
        </CardContent>
      </Card>

      {/* Best Performing Source */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Source</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">
            {bestSource ? bestSource.source : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {bestSource
              ? `${bestSource.successRate.toFixed(0)}% success rate (${bestSource.successful}/${bestSource.total})`
              : 'No data yet'}
          </p>
        </CardContent>
      </Card>

      {/* Best Day to Apply */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best Day to Apply</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bestDay ? bestDay.day : 'N/A'}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {bestDay ? `${bestDay.successRate.toFixed(0)}% success rate` : 'No data yet'}
          </p>
        </CardContent>
      </Card>

      {/* Total Sources Used */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Application Sources</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(sourcePerformance.length)}</div>
          <p className="text-xs text-muted-foreground mt-1">Different sources used</p>
        </CardContent>
      </Card>

      {/* Source Performance Chart */}
      {sourcePerformance.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Source Performance</CardTitle>
            <CardDescription>Success rate by application source</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourcePerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="source" className="text-xs capitalize" />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium capitalize">{data.source}</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Total: {data.total}</p>
                            <p>Successful: {data.successful}</p>
                            <p>Success Rate: {data.successRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Day of Week Performance Chart */}
      {dayOfWeekPerformance.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Best Days to Apply</CardTitle>
            <CardDescription>Success rate by day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dayOfWeekPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{data.day}</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Total: {data.total}</p>
                            <p>Successful: {data.successful}</p>
                            <p>Success Rate: {data.successRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="successRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
