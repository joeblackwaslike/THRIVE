import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateInterviewStageStats } from '@/lib/analytics';
import { useInterviewsStore } from '@/stores/interviewsStore';

interface InterviewStageChartProps {
  period?: {
    start: Date;
    end: Date;
  };
}

const STAGE_COLORS: Record<string, string> = {
  'phone screen': '#3b82f6',
  technical: '#8b5cf6',
  behavioral: '#f59e0b',
  'on site': '#10b981',
  final: '#06b6d4',
  other: '#6b7280',
};

export function InterviewStageChart({ period }: InterviewStageChartProps = {}) {
  const { interviews } = useInterviewsStore();

  const stageStats = useMemo(
    () => calculateInterviewStageStats(interviews, period),
    [interviews, period],
  );

  const hasData = stageStats.length > 0;

  // Prepare data for the chart
  const chartData = stageStats.map((stat) => ({
    stage: stat.stage.charAt(0).toUpperCase() + stat.stage.slice(1),
    count: stat.count,
    successRate: stat.successRate,
    averageDuration: stat.averageDuration,
    color: STAGE_COLORS[stat.stage.toLowerCase()] || STAGE_COLORS.other,
  }));

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview Stages</CardTitle>
          <CardDescription>Breakdown of interviews by stage and success rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Calendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">No interview data available</p>
            <p className="text-xs mt-1">Interview stages will appear as you add them</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Stages</CardTitle>
        <CardDescription>
          Performance across {stageStats.reduce((sum, s) => sum + s.count, 0)} interviews
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="stage" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="font-medium mb-1">{data.stage}</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Interviews: {data.count}</p>
                        <p>Success Rate: {data.successRate.toFixed(1)}%</p>
                        <p>Avg Duration: {data.averageDuration.toFixed(1)} days</p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Interviews" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Detailed Stats */}
        <div className="mt-4 pt-4 border-t space-y-3">
          {stageStats.map((stat) => (
            <div key={stat.stage} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: STAGE_COLORS[stat.stage.toLowerCase()] || STAGE_COLORS.other,
                  }}
                />
                <span className="text-sm capitalize">{stat.stage}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  {stat.count} interview{stat.count !== 1 ? 's' : ''}
                </span>
                <span className="font-medium text-green-600">
                  {stat.successRate.toFixed(0)}% success
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
