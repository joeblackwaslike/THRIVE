import { Clock, DollarSign, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Application, Interview } from '@/types';

interface CompanyMetrics {
  companyName: string;
  totalApplications: number;
  interviewRate: number;
  offerRate: number;
  avgResponseTime: number;
  avgSalary: number;
  activeApplications: number;
  rejectedApplications: number;
  successRate: number;
}

interface CompanyComparisonProps {
  applications: Application[];
  interviews: Interview[];
}

export function CompanyComparison({ applications, interviews }: CompanyComparisonProps) {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  // Get unique company names
  const companyNames = useMemo(() => {
    return Array.from(new Set(applications.map((app) => app.companyName))).sort();
  }, [applications]);

  // Calculate metrics for each company
  const calculateCompanyMetrics = useCallback(
    (companyName: string): CompanyMetrics => {
      const companyApps = applications.filter((app) => app.companyName === companyName);
      const totalApplications = companyApps.length;

      if (totalApplications === 0) {
        return {
          companyName,
          totalApplications: 0,
          interviewRate: 0,
          offerRate: 0,
          avgResponseTime: 0,
          avgSalary: 0,
          activeApplications: 0,
          rejectedApplications: 0,
          successRate: 0,
        };
      }

      // Interview rate
      const appsWithInterviews = companyApps.filter((app) =>
        interviews.some((interview) => interview.applicationId === app.id),
      ).length;
      const interviewRate = (appsWithInterviews / totalApplications) * 100;

      // Offer rate
      const offersReceived = companyApps.filter(
        (app) => app.status === 'offer' || app.status === 'accepted',
      ).length;
      const offerRate = (offersReceived / totalApplications) * 100;

      // Success rate (offers / total)
      const successRate = offerRate;

      // Average response time
      const responseTimes = companyApps
        .filter((app) => app.appliedDate && app.firstInterviewDate)
        .map((app) => {
          if (!app.appliedDate || !app.firstInterviewDate) return 0;
          const applied = new Date(app.appliedDate);
          const firstInterview = new Date(app.firstInterviewDate);
          return Math.floor((firstInterview.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
        });
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      // Average salary
      const salaries = companyApps
        .filter((app) => app.salary?.min && app.salary?.max)
        .map((app) => {
          if (!app.salary?.min || !app.salary?.max) return 0;
          return (app.salary.min + app.salary.max) / 2;
        });
      const avgSalary =
        salaries.length > 0 ? salaries.reduce((sum, sal) => sum + sal, 0) / salaries.length : 0;

      // Active vs rejected
      const activeApplications = companyApps.filter(
        (app) => !['rejected', 'withdrawn', 'accepted'].includes(app.status),
      ).length;
      const rejectedApplications = companyApps.filter((app) => app.status === 'rejected').length;

      return {
        companyName,
        totalApplications,
        interviewRate,
        offerRate,
        avgResponseTime,
        avgSalary,
        activeApplications,
        rejectedApplications,
        successRate,
      };
    },
    [applications, interviews],
  );

  const companyMetrics = useMemo(() => {
    return selectedCompanies.map(calculateCompanyMetrics);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanies, calculateCompanyMetrics]);

  const addCompany = (companyName: string) => {
    if (!selectedCompanies.includes(companyName) && selectedCompanies.length < 5) {
      setSelectedCompanies([...selectedCompanies, companyName]);
    }
  };

  const removeCompany = (companyName: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c !== companyName));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare data for comparison charts
  const comparisonData = useMemo(() => {
    return [
      {
        metric: 'Applications',
        ...Object.fromEntries(companyMetrics.map((m) => [m.companyName, m.totalApplications])),
      },
      {
        metric: 'Interview Rate',
        ...Object.fromEntries(
          companyMetrics.map((m) => [m.companyName, m.interviewRate.toFixed(1)]),
        ),
      },
      {
        metric: 'Offer Rate',
        ...Object.fromEntries(companyMetrics.map((m) => [m.companyName, m.offerRate.toFixed(1)])),
      },
      {
        metric: 'Response Time',
        ...Object.fromEntries(
          companyMetrics.map((m) => [m.companyName, m.avgResponseTime.toFixed(0)]),
        ),
      },
    ];
  }, [companyMetrics]);

  // Prepare data for radar chart
  const radarData = useMemo(() => {
    const metrics = ['Interview Rate', 'Offer Rate', 'Active Apps', 'Success Rate'];

    return metrics.map((metric) => {
      const dataPoint: Record<string, string | number> = { metric };

      companyMetrics.forEach((company) => {
        let value = 0;
        switch (metric) {
          case 'Interview Rate':
            value = company.interviewRate;
            break;
          case 'Offer Rate':
            value = company.offerRate;
            break;
          case 'Active Apps':
            value =
              company.totalApplications > 0
                ? (company.activeApplications / company.totalApplications) * 100
                : 0;
            break;
          case 'Success Rate':
            value = company.successRate;
            break;
        }
        dataPoint[company.companyName] = value;
      });

      return dataPoint;
    });
  }, [companyMetrics]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Company Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Companies to Compare</CardTitle>
          <CardDescription>
            Choose up to 5 companies to compare their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select onValueChange={addCompany}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                {companyNames
                  .filter((name) => !selectedCompanies.includes(name))
                  .map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              disabled={selectedCompanies.length >= 5}
              onClick={() => {
                // Select will handle the addition
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {selectedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCompanies.map((company) => (
                <Badge key={company} variant="secondary" className="text-sm py-1 px-3">
                  {company}
                  <button
                    type="button"
                    onClick={() => removeCompany(company)}
                    className="ml-2 rounded-sm hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {selectedCompanies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Select companies from the dropdown above to start comparing
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompanies.length > 0 && (
        <>
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companyMetrics.map((metrics) => (
              <Card key={metrics.companyName}>
                <CardHeader>
                  <CardTitle className="text-lg">{metrics.companyName}</CardTitle>
                  <CardDescription>Performance Overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Applications</span>
                    <span className="font-semibold">{metrics.totalApplications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interview Rate</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="font-semibold">{metrics.interviewRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Offer Rate</span>
                    <div className="flex items-center gap-1">
                      {metrics.offerRate > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="font-semibold">{metrics.offerRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Response</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="font-semibold">
                        {metrics.avgResponseTime > 0
                          ? `${metrics.avgResponseTime.toFixed(0)} days`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {metrics.avgSalary > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Salary</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-500" />
                        <span className="font-semibold">{formatCurrency(metrics.avgSalary)}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="bg-green-50">
                        {metrics.activeApplications} Active
                      </Badge>
                      <Badge variant="outline" className="bg-red-50">
                        {metrics.rejectedApplications} Rejected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Charts */}
          {selectedCompanies.length >= 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Bar Chart Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Metrics Comparison</CardTitle>
                  <CardDescription>Side-by-side comparison of key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                      <Legend />
                      {companyMetrics.map((company, index) => (
                        <Bar
                          key={company.companyName}
                          dataKey={company.companyName}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>Multi-dimensional performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                      <Legend />
                      {companyMetrics.map((company, index) => (
                        <Radar
                          key={company.companyName}
                          name={company.companyName}
                          dataKey={company.companyName}
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.3}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Comparison Table */}
          {selectedCompanies.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
                <CardDescription>Complete metrics breakdown for selected companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Metric</th>
                        {companyMetrics.map((company) => (
                          <th
                            key={company.companyName}
                            className="text-right py-3 px-4 font-semibold"
                          >
                            {company.companyName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          Total Applications
                        </td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.totalApplications}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Interview Rate</td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.interviewRate.toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Offer Rate</td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.offerRate.toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Success Rate</td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            <Badge
                              variant={company.successRate > 20 ? 'default' : 'secondary'}
                              className="font-semibold"
                            >
                              {company.successRate.toFixed(1)}%
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          Avg Response Time
                        </td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.avgResponseTime > 0
                              ? `${company.avgResponseTime.toFixed(0)} days`
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">Avg Salary</td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.avgSalary > 0 ? formatCurrency(company.avgSalary) : 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          Active Applications
                        </td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.activeApplications}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          Rejected Applications
                        </td>
                        {companyMetrics.map((company) => (
                          <td key={company.companyName} className="text-right py-3 px-4">
                            {company.rejectedApplications}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
