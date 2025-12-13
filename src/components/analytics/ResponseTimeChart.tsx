import { isWithinInterval } from 'date-fns';
import { Clock } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateResponseTimeDistribution } from '@/lib/analytics';
import { useApplicationsStore } from '@/stores/applicationsStore';

interface ResponseTimeChartProps {
  period?: {
    start: Date;
    end: Date;
  };
}

export function ResponseTimeChart({ period }: ResponseTimeChartProps = {}) {
  const { applications } = useApplicationsStore();

  // Filter applications by period if provided
  const filteredApplications = useMemo(() => {
    if (!period) return applications;

    return applications.filter((app) => {
      const appDate = new Date(app.appliedDate || app.createdAt);
      return isWithinInterval(appDate, { start: period.start, end: period.end });
    });
  }, [applications, period]);

  const distributionData = useMemo(
    () => calculateResponseTimeDistribution(filteredApplications),
    [filteredApplications],
  );

  const hasData = distributionData.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time Distribution</CardTitle>
          <CardDescription>How long companies take to respond</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Clock className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">No response time data available</p>
            <p className="text-xs mt-1">Data will appear as applications progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Distribution</CardTitle>
        <CardDescription>How long companies take to respond to your applications</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.range}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} application{data.count !== 1 ? 's' : ''} (
                        {data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          {distributionData.map((item) => (
            <div key={item.range} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{item.range}:</span>
              <span className="text-sm font-medium">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
