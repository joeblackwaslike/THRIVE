import { format, subYears } from 'date-fns';
import { Calendar, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartRangeSelector } from '@/components/ui/chart-range-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateAnalytics } from '@/lib/analytics';
import type { Application, Interview } from '@/types';

interface PeriodComparisonProps {
  applications: Application[];
  interviews: Interview[];
}

export function PeriodComparison({ applications, interviews }: PeriodComparisonProps) {
  const [comparisonType, setComparisonType] = useState<'yoy' | 'quarter' | 'month'>('yoy');
  const [monthlyRange, setMonthlyRange] = useState<{ start: number; end: number } | null>(null);

  // Year-over-year comparison
  const yoyComparison = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const thisYearStart = new Date(currentYear, 0, 1);
    const thisYearEnd = new Date();
    const lastYearStart = subYears(thisYearStart, 1);
    const lastYearEnd = subYears(thisYearEnd, 1);

    const thisYearMetrics = calculateAnalytics(applications, interviews, {
      start: thisYearStart,
      end: thisYearEnd,
    });

    const lastYearMetrics = calculateAnalytics(applications, interviews, {
      start: lastYearStart,
      end: lastYearEnd,
    });

    return {
      thisYear: { year: currentYear, ...thisYearMetrics },
      lastYear: { year: currentYear - 1, ...lastYearMetrics },
    };
  }, [applications, interviews]);

  // Quarter-over-quarter comparison
  const quarterComparison = useMemo(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarters = [];

    for (let i = 0; i < 4; i++) {
      const quarterStart = new Date(now.getFullYear(), (currentQuarter - i) * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), (currentQuarter - i + 1) * 3, 0);

      const metrics = calculateAnalytics(applications, interviews, {
        start: quarterStart,
        end: quarterEnd > now ? now : quarterEnd,
      });

      quarters.push({
        label: `Q${((currentQuarter - i + 4) % 4) + 1} ${quarterStart.getFullYear()}`,
        ...metrics,
      });
    }

    return quarters.reverse();
  }, [applications, interviews]);

  // Month-over-month comparison (last 12 months)
  const monthComparison = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const metrics = calculateAnalytics(applications, interviews, {
        start: monthStart,
        end: monthEnd > now ? now : monthEnd,
      });

      months.push({
        label: format(monthStart, 'MMM yyyy'),
        ...metrics,
      });
    }

    return months;
  }, [applications, interviews]);

  // Filter monthly data based on visible range
  const filteredMonthComparison = useMemo(() => {
    if (!monthlyRange) return monthComparison;
    return monthComparison.slice(monthlyRange.start, monthlyRange.end + 1);
  }, [monthComparison, monthlyRange]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Time Period Comparison
              </CardTitle>
              <CardDescription>
                Compare metrics across different time periods to identify trends
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={comparisonType}
            onValueChange={(v) => setComparisonType(v as typeof comparisonType)}
          >
            <TabsList>
              <TabsTrigger value="yoy">Year-over-Year</TabsTrigger>
              <TabsTrigger value="quarter">Quarterly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
            </TabsList>

            {/* Year-over-Year */}
            <TabsContent value="yoy" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {yoyComparison.thisYear.totalApplications}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {yoyComparison.thisYear.year}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(
                          calculateChange(
                            yoyComparison.thisYear.totalApplications,
                            yoyComparison.lastYear.totalApplications,
                          ),
                        )}
                        <span
                          className={getTrendColor(
                            calculateChange(
                              yoyComparison.thisYear.totalApplications,
                              yoyComparison.lastYear.totalApplications,
                            ),
                          )}
                        >
                          {Math.abs(
                            calculateChange(
                              yoyComparison.thisYear.totalApplications,
                              yoyComparison.lastYear.totalApplications,
                            ),
                          ).toFixed(1)}
                          %
                        </span>
                        <span>
                          vs {yoyComparison.lastYear.totalApplications} in{' '}
                          {yoyComparison.lastYear.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {yoyComparison.thisYear.interviewConversionRate.toFixed(1)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {yoyComparison.thisYear.year}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(
                          calculateChange(
                            yoyComparison.thisYear.interviewConversionRate,
                            yoyComparison.lastYear.interviewConversionRate,
                          ),
                        )}
                        <span
                          className={getTrendColor(
                            calculateChange(
                              yoyComparison.thisYear.interviewConversionRate,
                              yoyComparison.lastYear.interviewConversionRate,
                            ),
                          )}
                        >
                          {Math.abs(
                            calculateChange(
                              yoyComparison.thisYear.interviewConversionRate,
                              yoyComparison.lastYear.interviewConversionRate,
                            ),
                          ).toFixed(1)}
                          %
                        </span>
                        <span>
                          vs {yoyComparison.lastYear.interviewConversionRate.toFixed(1)}% in{' '}
                          {yoyComparison.lastYear.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {yoyComparison.thisYear.successfulApplications}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {yoyComparison.thisYear.year}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(
                          calculateChange(
                            yoyComparison.thisYear.successfulApplications,
                            yoyComparison.lastYear.successfulApplications,
                          ),
                        )}
                        <span
                          className={getTrendColor(
                            calculateChange(
                              yoyComparison.thisYear.successfulApplications,
                              yoyComparison.lastYear.successfulApplications,
                            ),
                          )}
                        >
                          {Math.abs(
                            calculateChange(
                              yoyComparison.thisYear.successfulApplications,
                              yoyComparison.lastYear.successfulApplications,
                            ),
                          ).toFixed(1)}
                          %
                        </span>
                        <span>
                          vs {yoyComparison.lastYear.successfulApplications} in{' '}
                          {yoyComparison.lastYear.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">
                          {yoyComparison.thisYear.averageResponseTime.toFixed(0)} days
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {yoyComparison.thisYear.year}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(
                          -calculateChange(
                            yoyComparison.thisYear.averageResponseTime,
                            yoyComparison.lastYear.averageResponseTime,
                          ),
                        )}
                        <span
                          className={getTrendColor(
                            -calculateChange(
                              yoyComparison.thisYear.averageResponseTime,
                              yoyComparison.lastYear.averageResponseTime,
                            ),
                          )}
                        >
                          {Math.abs(
                            calculateChange(
                              yoyComparison.thisYear.averageResponseTime,
                              yoyComparison.lastYear.averageResponseTime,
                            ),
                          ).toFixed(1)}
                          %
                        </span>
                        <span>
                          vs {yoyComparison.lastYear.averageResponseTime.toFixed(0)} days in{' '}
                          {yoyComparison.lastYear.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quarterly Comparison */}
            <TabsContent value="quarter" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Trends</CardTitle>
                  <CardDescription>Performance metrics for the last 4 quarters</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={quarterComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalApplications"
                        fill="#3b82f6"
                        name="Applications"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="successfulApplications"
                        fill="#10b981"
                        name="Offers"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="interviewConversionRate"
                        fill="#f59e0b"
                        name="Interview Rate (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Comparison */}
            <TabsContent value="month" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Performance metrics for the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={filteredMonthComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalApplications"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Applications"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="successfulApplications"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Offers"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="interviewConversionRate"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Interview Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Chart Range Selector */}
                  {monthComparison.length > 4 && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span>📊 Zoom to Range</span>
                        <span className="text-[10px] opacity-60">
                          ({filteredMonthComparison.length} of {monthComparison.length} months)
                        </span>
                      </div>
                      <ChartRangeSelector
                        min={0}
                        max={monthComparison.length - 1}
                        formatLabel={(idx) => monthComparison[idx]?.label || ''}
                        onChange={setMonthlyRange}
                        initialRange={monthlyRange || undefined}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
