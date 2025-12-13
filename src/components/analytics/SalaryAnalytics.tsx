import { DollarSign, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateExpectedValue,
  calculateOfferedVsExpected,
  calculateSalaryByStatus,
  calculateSalaryDistribution,
} from '@/lib/analytics';
import type { Application } from '@/types';

interface SalaryAnalyticsProps {
  applications: Application[];
  period?: { start: Date; end: Date };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  technical: 'Technical',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function SalaryAnalytics({ applications, period }: SalaryAnalyticsProps) {
  // Filter by period if specified
  const filteredApplications = useMemo(() => {
    if (!period) return applications;

    return applications.filter((app) => {
      if (!app.appliedDate) return false;
      const date = new Date(app.appliedDate);
      return date >= period.start && date <= period.end;
    });
  }, [applications, period]);

  const salaryByStatus = useMemo(
    () => calculateSalaryByStatus(filteredApplications),
    [filteredApplications],
  );

  const salaryDistribution = useMemo(
    () => calculateSalaryDistribution(filteredApplications),
    [filteredApplications],
  );

  const expectedValue = useMemo(
    () => calculateExpectedValue(filteredApplications),
    [filteredApplications],
  );

  const offeredVsExpected = useMemo(
    () => calculateOfferedVsExpected(filteredApplications),
    [filteredApplications],
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expectedValue.averageSalary)}</div>
            <p className="text-xs text-muted-foreground">
              {expectedValue.withSalary} of {expectedValue.totalApplications} applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expectedValue.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">For applications with salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expectedValue.expectedValue)}</div>
            <p className="text-xs text-muted-foreground">Avg salary × success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offered vs Expected</CardTitle>
            {getTrendIcon(offeredVsExpected.difference)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {offeredVsExpected.percentDifference > 0 ? '+' : ''}
              {offeredVsExpected.percentDifference.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {offeredVsExpected.count} offers received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Salary by Status</CardTitle>
              <CardDescription>
                See how salary expectations vary across different application stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salaryByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salaryByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tickFormatter={(value) => STATUS_LABELS[value] || value}
                    />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Avg Salary']}
                      labelFormatter={(label) => STATUS_LABELS[label] || label}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                    />
                    <Legend />
                    <Bar dataKey="avgSalary" fill="#3b82f6" name="Average Salary" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                  No salary data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Salary Distribution</CardTitle>
                <CardDescription>Number of applications in each salary range</CardDescription>
              </CardHeader>
              <CardContent>
                {salaryDistribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salaryDistribution.filter((d) => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => {
                          const percent = Number(props.percent) || 0;
                          const name = String(props.name) || '';
                          return `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {salaryDistribution.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Applications']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No salary data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution Details</CardTitle>
                <CardDescription>Average salary within each range</CardDescription>
              </CardHeader>
              <CardContent>
                {salaryDistribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salaryDistribution.filter((d) => d.count > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Avg Salary']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                      />
                      <Legend />
                      <Bar dataKey="avgSalary" fill="#10b981" name="Average Salary" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No salary data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offered vs Expected Salary</CardTitle>
              <CardDescription>
                Compare actual offers received to average expected salary
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offeredVsExpected.count > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Average Expected Salary
                      </div>
                      <div className="text-3xl font-bold">
                        {formatCurrency(offeredVsExpected.averageExpected)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on all applications with salary info
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Average Offered Salary
                      </div>
                      <div className="text-3xl font-bold">
                        {formatCurrency(offeredVsExpected.averageOffered)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on {offeredVsExpected.count} offers received
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Difference</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(Math.abs(offeredVsExpected.difference))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(offeredVsExpected.difference)}
                        <span
                          className={`text-2xl font-bold ${
                            offeredVsExpected.difference > 0
                              ? 'text-green-500'
                              : offeredVsExpected.difference < 0
                                ? 'text-red-500'
                                : 'text-gray-500'
                          }`}
                        >
                          {offeredVsExpected.percentDifference > 0 ? '+' : ''}
                          {offeredVsExpected.percentDifference.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Expected',
                          value: offeredVsExpected.averageExpected,
                        },
                        {
                          name: 'Offered',
                          value: offeredVsExpected.averageOffered,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Salary']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#8b5cf6" name="Average Salary" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                  No offer data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
