import { Award, Calendar, Clock, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';

export function ResponseMetricsCard() {
  const { applications } = useApplicationsStore();
  const { interviews } = useInterviewsStore();

  const metrics = useMemo(() => {
    const totalApplications = applications.length;
    if (totalApplications === 0) {
      return {
        responseRate: 0,
        interviewRate: 0,
        offerRate: 0,
        acceptanceRate: 0,
        screeningRate: 0,
        rejectionRate: 0,
        avgTimeToResponse: 0,
        totalInterviews: 0,
        totalOffers: 0,
      };
    }

    // Applications with any response (not just "applied")
    const responded = applications.filter((app) => app.status !== 'applied').length;

    // Applications that reached screening stage
    const screening = applications.filter((app) =>
      ['screening', 'interviewing', 'offer', 'accepted'].includes(app.status),
    ).length;

    // Applications that reached interview stage
    const interviewing = applications.filter((app) =>
      ['interviewing', 'offer', 'accepted'].includes(app.status),
    ).length;

    // Offers received
    const offers = applications.filter((app) => ['offer', 'accepted'].includes(app.status)).length;

    // Accepted offers
    const accepted = applications.filter((app) => app.status === 'accepted').length;

    // Rejections
    const rejected = applications.filter((app) => app.status === 'rejected').length;

    // Total interviews scheduled
    const totalInterviews = interviews.length;

    // Calculate average time to first response (days)
    let avgTimeToResponse = 0;
    const responseTimes: number[] = [];

    applications.forEach((app) => {
      if (app.appliedDate && app.updatedAt && app.status !== 'applied') {
        const applied = new Date(app.appliedDate).getTime();
        const updated = new Date(app.updatedAt).getTime();
        const days = Math.floor((updated - applied) / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          responseTimes.push(days);
        }
      }
    });

    if (responseTimes.length > 0) {
      avgTimeToResponse = Math.round(
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      );
    }

    return {
      responseRate: Math.round((responded / totalApplications) * 100),
      screeningRate: Math.round((screening / totalApplications) * 100),
      interviewRate: Math.round((interviewing / totalApplications) * 100),
      offerRate: Math.round((offers / totalApplications) * 100),
      acceptanceRate: offers > 0 ? Math.round((accepted / offers) * 100) : 0,
      rejectionRate: Math.round((rejected / totalApplications) * 100),
      avgTimeToResponse,
      totalInterviews,
      totalOffers: offers,
    };
  }, [applications, interviews]);

  const totalApplications = applications.length;

  if (totalApplications === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Success Metrics</CardTitle>
          <CardDescription>Track your conversion rates and response times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No application data yet. Start applying to see your metrics!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 75) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
    if (rate >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Metrics</CardTitle>
        <CardDescription>
          Conversion funnel and response analytics for {totalApplications} application
          {totalApplications !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Conversion Funnel */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversion Funnel
          </h4>

          {/* Response Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Response Rate</span>
              <span className={`font-semibold ${getStatusColor(metrics.responseRate)}`}>
                {metrics.responseRate}%
              </span>
            </div>
            <Progress value={metrics.responseRate} className="h-2" />
            <p className="text-xs text-muted-foreground">Applications receiving any response</p>
          </div>

          {/* Screening Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Screening Rate</span>
              <span className={`font-semibold ${getStatusColor(metrics.screeningRate)}`}>
                {metrics.screeningRate}%
              </span>
            </div>
            <Progress value={metrics.screeningRate} className="h-2" />
            <p className="text-xs text-muted-foreground">Applications reaching screening stage</p>
          </div>

          {/* Interview Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interview Rate</span>
              <span className={`font-semibold ${getStatusColor(metrics.interviewRate)}`}>
                {metrics.interviewRate}%
              </span>
            </div>
            <Progress value={metrics.interviewRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Applications reaching interview stage ({metrics.totalInterviews} interview
              {metrics.totalInterviews !== 1 ? 's' : ''})
            </p>
          </div>

          {/* Offer Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Offer Rate</span>
              <span className={`font-semibold ${getStatusColor(metrics.offerRate)}`}>
                {metrics.offerRate}%
              </span>
            </div>
            <Progress value={metrics.offerRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Applications resulting in offers ({metrics.totalOffers} offer
              {metrics.totalOffers !== 1 ? 's' : ''})
            </p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {/* Acceptance Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs">Acceptance Rate</span>
            </div>
            <p className="text-2xl font-bold">{metrics.acceptanceRate}%</p>
            <p className="text-xs text-muted-foreground">Of offers received</p>
          </div>

          {/* Rejection Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              {metrics.rejectionRate < 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs">Rejection Rate</span>
            </div>
            <p className="text-2xl font-bold">{metrics.rejectionRate}%</p>
            <p className="text-xs text-muted-foreground">Of total applications</p>
          </div>

          {/* Avg Time to Response */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg. Response Time</span>
            </div>
            <p className="text-2xl font-bold">{metrics.avgTimeToResponse}</p>
            <p className="text-xs text-muted-foreground">Days to first response</p>
          </div>

          {/* Active Pipeline */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Active Pipeline</span>
            </div>
            <p className="text-2xl font-bold">
              {
                applications.filter((app) =>
                  ['applied', 'screening', 'interviewing'].includes(app.status),
                ).length
              }
            </p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Industry Benchmarks</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Good response rate:</span>
              <span className="font-medium">30-50%</span>
            </div>
            <div className="flex justify-between">
              <span>Good interview rate:</span>
              <span className="font-medium">10-25%</span>
            </div>
            <div className="flex justify-between">
              <span>Good offer rate:</span>
              <span className="font-medium">5-15%</span>
            </div>
            <div className="flex justify-between">
              <span>Typical response time:</span>
              <span className="font-medium">7-14 days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
