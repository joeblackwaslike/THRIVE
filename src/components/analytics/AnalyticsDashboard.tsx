import { formatDistanceToNow, subDays } from 'date-fns';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Percent,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePeriodSlider } from '@/components/ui/time-period-slider';
import { useDataFreshness } from '@/hooks/useAnimations';
import {
  useMetricChangeNotifications,
  useMilestoneNotifications,
} from '@/hooks/useMilestoneNotifications';
import {
  calculateAnalytics,
  calculateCompanyStats,
  calculateMonthlyTrends,
  calculateStatusDistribution,
  formatNumber,
  formatPercentage,
  generateTimeSeriesData,
} from '@/lib/analytics';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useDashboardLayoutStore } from '@/stores/dashboardLayoutStore';
import { useInterviewsStore } from '@/stores/interviewsStore';
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/types/analytics';
import { AdditionalInsights } from './AdditionalInsights';
import {
  type AnalyticsFilters,
  AnalyticsFiltersPanel,
  applyAnalyticsFilters,
} from './AnalyticsFilters';
import { AnnotationsList } from './AnnotationsList';
import { ApplicationFunnelChart } from './ApplicationFunnelChart';
import { ExportOptions } from './ExportOptions';
import { GoalsTracking } from './GoalsTracking';
import { InterviewStageChart } from './InterviewStageChart';
import { LayoutManager } from './LayoutManager';
import { ReportGenerator } from './ReportGenerator';
import { ResponseTimeChart } from './ResponseTimeChart';
import { MetricGrid, StatCard } from './StatCard';

export function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod['value']>('30d');
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    statuses: [],
    companyNames: [],
    workTypes: [],
    priorities: [],
    tags: [],
  });
  const { getVisibleWidgets } = useDashboardLayoutStore();
  const visibleWidgets = getVisibleWidgets();
  const { applications } = useApplicationsStore();
  const { interviews } = useInterviewsStore();

  // Real-time milestone notifications
  useMilestoneNotifications(applications, interviews);

  // Apply filters to applications
  const filteredApplications = useMemo(
    () => applyAnalyticsFilters(applications, filters),
    [applications, filters]
  );

  // Calculate period dates
  const period = useMemo(() => {
    const periodConfig = ANALYTICS_PERIODS.find((p) => p.value === selectedPeriod);
    if (!periodConfig || selectedPeriod === 'all' || !periodConfig.days) {
      return undefined;
    }
    return {
      start: subDays(new Date(), periodConfig.days),
      end: new Date(),
    };
  }, [selectedPeriod]);

  // Calculate previous period dates for comparison
  const previousPeriod = useMemo(() => {
    const periodConfig = ANALYTICS_PERIODS.find((p) => p.value === selectedPeriod);
    if (!periodConfig || selectedPeriod === 'all' || !periodConfig.days || !showComparison) {
      return undefined;
    }
    return {
      start: subDays(new Date(), periodConfig.days * 2),
      end: subDays(new Date(), periodConfig.days),
    };
  }, [selectedPeriod, showComparison]);

  // Calculate the number of days for the selected period
  const periodDays = useMemo(() => {
    const periodConfig = ANALYTICS_PERIODS.find((p) => p.value === selectedPeriod);
    return periodConfig?.days || 365; // Default to 365 for 'all time'
  }, [selectedPeriod]);

  // Calculate analytics with filtered data
  const metrics = useMemo(
    () => calculateAnalytics(filteredApplications, interviews, period),
    [filteredApplications, interviews, period]
  );

  // Calculate previous period metrics for comparison
  const previousMetrics = useMemo(
    () =>
      previousPeriod ? calculateAnalytics(filteredApplications, interviews, previousPeriod) : null,
    [filteredApplications, interviews, previousPeriod]
  );

  // Real-time metric change notifications
  useMetricChangeNotifications(
    {
      responseRate: metrics.responseRate,
      interviewConversionRate: metrics.interviewConversionRate,
      offerRate: metrics.offerRate,
    },
    previousMetrics
      ? {
          responseRate: previousMetrics.responseRate,
          interviewConversionRate: previousMetrics.interviewConversionRate,
          offerRate: previousMetrics.offerRate,
        }
      : undefined
  );

  // Calculate trends
  const calculateTrend = (current: number, previous: number | undefined) => {
    if (!showComparison || !previous || previous === 0) return undefined;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.round(change * 10) / 10,
      label: 'vs previous period',
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    } as const;
  };

  const timeSeriesData = useMemo(
    () => generateTimeSeriesData(applications, interviews, periodDays, period),
    [applications, interviews, periodDays, period]
  );

  const statusDistribution = useMemo(
    () => calculateStatusDistribution(applications, period),
    [applications, period]
  );

  const companyStats = useMemo(
    () => calculateCompanyStats(filteredApplications, interviews, period),
    [filteredApplications, interviews, period]
  );

  const monthlyTrends = useMemo(
    () => calculateMonthlyTrends(filteredApplications, interviews, 6, period),
    [filteredApplications, interviews, period]
  );

  const resetFilters = () => {
    setFilters({
      statuses: [],
      companyNames: [],
      workTypes: [],
      priorities: [],
      tags: [],
    });
  };

  // Data freshness indicator
  const { lastUpdated } = useDataFreshness();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <div className="flex items-center gap-3 text-muted-foreground">
            <p>Track your job search progress and insights</p>
            <span className="text-xs">·</span>
            <p className="text-xs">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <LayoutManager />
          <TimePeriodSlider
            periods={ANALYTICS_PERIODS}
            selectedValue={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value as AnalyticsPeriod['value'])}
            className="min-w-[300px]"
          />
          {selectedPeriod !== 'all' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Compare to previous period</span>
            </label>
          )}
        </div>
      </div>

      {/* Filters */}
      {visibleWidgets.includes('filters') && (
        <AnalyticsFiltersPanel
          applications={applications}
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      )}

      {/* Key Metrics */}
      {visibleWidgets.includes('stats-overview') && (
        <MetricGrid>
          <StatCard
            title="Total Applications"
            value={formatNumber(metrics.totalApplications)}
            icon={Target}
            description={`${metrics.applicationsThisWeek} this week`}
            trend={calculateTrend(metrics.totalApplications, previousMetrics?.totalApplications)}
          />
          <StatCard
            title="Response Rate"
            value={formatPercentage(metrics.responseRate)}
            icon={Percent}
            description={`${metrics.noResponseCount} no response`}
            trend={calculateTrend(metrics.responseRate, previousMetrics?.responseRate)}
          />
          <StatCard
            title="Interviews"
            value={formatNumber(metrics.totalInterviews)}
            icon={Calendar}
            description={`${metrics.scheduledInterviews} scheduled`}
            trend={calculateTrend(metrics.totalInterviews, previousMetrics?.totalInterviews)}
          />
          <StatCard
            title="Success Rate"
            value={formatPercentage(metrics.offerRate)}
            icon={CheckCircle}
            description={`${metrics.successfulApplications} offers`}
            trend={calculateTrend(metrics.offerRate, previousMetrics?.offerRate)}
          />
          <StatCard
            title="Avg Response Time"
            value={`${Math.round(metrics.averageResponseTime)}d`}
            icon={Clock}
            description="Days to hear back"
            trend={calculateTrend(
              metrics.averageResponseTime,
              previousMetrics?.averageResponseTime
            )}
          />
          <StatCard
            title="Interview Conversion"
            value={formatPercentage(metrics.interviewConversionRate)}
            icon={TrendingUp}
            description="Apps → Interviews"
            trend={calculateTrend(
              metrics.interviewConversionRate,
              previousMetrics?.interviewConversionRate
            )}
          />
          <StatCard
            title="Offer Conversion"
            value={formatPercentage(metrics.interviewToOfferRate)}
            icon={BarChart3}
            description="Interviews → Offers"
            trend={calculateTrend(
              metrics.interviewToOfferRate,
              previousMetrics?.interviewToOfferRate
            )}
          />
          <StatCard
            title="Active Applications"
            value={formatNumber(metrics.activeApplications)}
            icon={Building2}
            description="In progress"
            trend={calculateTrend(metrics.activeApplications, previousMetrics?.activeApplications)}
          />
        </MetricGrid>
      )}

      {/* Additional Insights */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight">Additional Insights</h3>
        <AdditionalInsights period={period} />
      </div>

      {/* Charts and Widgets */}
      <div className="space-y-6">
        {/* Timeline Chart */}
        {visibleWidgets.includes('timeline-chart') && (
          <Card>
            <CardHeader>
              <CardTitle>
                Application Activity (
                {ANALYTICS_PERIODS.find((p) => p.value === selectedPeriod)?.label || 'All Time'})
              </CardTitle>
              <CardDescription>
                Track your daily applications, interviews, offers, and rejections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 &&
              timeSeriesData.some(
                (d) => d.applications > 0 || d.interviews > 0 || d.offers > 0 || d.rejections > 0
              ) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Applications"
                    />
                    <Line
                      type="monotone"
                      dataKey="interviews"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Interviews"
                    />
                    <Line
                      type="monotone"
                      dataKey="offers"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Offers"
                    />
                    <Line
                      type="monotone"
                      dataKey="rejections"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Rejections"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">No activity data for this period</p>
                  <p className="text-xs mt-1">Applications will appear here as you add them</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Funnel */}
        {visibleWidgets.includes('funnel-chart') && <ApplicationFunnelChart period={period} />}

        {/* Status Distribution */}
        {visibleWidgets.includes('status-distribution') && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown by application status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry: any) => `${entry.status}: ${entry.count}`}
                      >
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <Target className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No application data available</p>
                    <p className="text-xs mt-1">
                      Start adding applications to see the distribution
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Details</CardTitle>
                <CardDescription>Count and percentage by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {statusDistribution.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-sm font-medium capitalize">
                            {status.status.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">{status.count}</span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {formatPercentage(status.percentage, 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No status data to display</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Response Time Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          {visibleWidgets.includes('response-time') && <ResponseTimeChart period={period} />}
          {visibleWidgets.includes('interview-stage') && <InterviewStageChart period={period} />}
        </div>

        {/* Company Stats */}
        {visibleWidgets.includes('company-stats') && (
          <Card>
            <CardHeader>
              <CardTitle>Top Companies</CardTitle>
              <CardDescription>Most applied companies with success rates</CardDescription>
            </CardHeader>
            <CardContent>
              {companyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={companyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="companyName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applicationsCount" fill="#3b82f6" name="Applications" />
                    <Bar dataKey="interviewsCount" fill="#8b5cf6" name="Interviews" />
                    <Bar dataKey="offersCount" fill="#10b981" name="Offers" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Building2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">No company data available</p>
                  <p className="text-xs mt-1">Add applications to track companies</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Export & Reports */}
        {visibleWidgets.includes('export-options') && (
          <ExportOptions
            applications={filteredApplications}
            interviews={interviews}
            metrics={metrics}
          />
        )}

        {/* Automated Reports */}
        {visibleWidgets.includes('report-generator') && (
          <ReportGenerator applications={filteredApplications} interviews={interviews} />
        )}

        {/* Goals & Tracking */}
        {visibleWidgets.includes('goals-tracking') && (
          <GoalsTracking applications={filteredApplications} interviews={interviews} />
        )}

        {/* Monthly Trends */}
        {visibleWidgets.includes('monthly-trends') && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Track your progress over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrends.length > 0 &&
                monthlyTrends.some((m) => m.applications > 0 || m.interviews > 0) ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                      <Bar dataKey="interviews" fill="#8b5cf6" name="Interviews" />
                      <Bar dataKey="offers" fill="#10b981" name="Offers" />
                      <Bar dataKey="rejections" fill="#ef4444" name="Rejections" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No monthly trend data available</p>
                    <p className="text-xs mt-1">Add applications to see trends over time</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Rate Trend</CardTitle>
                <CardDescription>Monthly response rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrends.length > 0 && monthlyTrends.some((m) => m.responseRate > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Line
                        type="monotone"
                        dataKey="responseRate"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Response Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                    <Percent className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No response rate data available</p>
                    <p className="text-xs mt-1">
                      Response rates will appear as applications progress
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Annotations */}
        {visibleWidgets.includes('annotations') && <AnnotationsList />}
      </div>
    </div>
  );
}
