import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createFileRoute, Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, FileText, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApplicationFunnelChart } from '@/components/analytics/ApplicationFunnelChart';
import { ApplicationsTimelineChart } from '@/components/analytics/ApplicationsTimelineChart';
import { ResponseMetricsCard } from '@/components/analytics/ResponseMetricsCard';
import { StatsOverview } from '@/components/analytics/StatsOverview';
import { StatusDistributionChart } from '@/components/analytics/StatusDistributionChart';
import { CustomWidgetRenderer } from '@/components/dashboard/CustomWidgetRenderer';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { DashboardWidgetWrapper } from '@/components/dashboard/DashboardWidgetWrapper';
import { ApplicationDialog } from '@/components/features/applications/ApplicationDialog';
import { InterviewDialog } from '@/components/features/interviews/InterviewDialog';

import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useCustomWidgetsStore } from '@/stores/customWidgetsStore';
import { type DashboardWidgetType, useDashboardStore } from '@/stores/dashboardStore';
import { useInterviewsStore } from '@/stores/interviewsStore';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { applications, fetchApplications } = useApplicationsStore();
  const { interviews, fetchInterviews } = useInterviewsStore();

  useEffect(() => {
    const initializeData = async () => {
      await fetchApplications();
      await fetchInterviews();
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchApplications, fetchInterviews]);

  // Get recent activity (last 5 applications/interviews)
  const recentActivity = useMemo(() => {
    const items = [
      ...applications.map((app) => ({
        id: app.id,
        type: 'application' as const,
        title: `Applied to ${app.position}`,
        subtitle: app.companyName,
        status: app.status,
        date: app.appliedDate || app.createdAt,
      })),
      ...interviews.map((interview) => {
        const app = applications.find((a) => a.id === interview.applicationId);
        return {
          id: interview.id,
          type: 'interview' as const,
          title: `Interview scheduled`,
          subtitle: app ? `${app.position} at ${app.companyName}` : 'Unknown',
          status: interview.status,
          date: interview.scheduledAt || interview.createdAt,
        };
      }),
    ];

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [applications, interviews]);

  const getStatusBadgeVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (['offer', 'accepted', 'completed'].includes(status)) return 'default';
    if (['rejected', 'cancelled'].includes(status)) return 'destructive';
    return 'secondary';
  };

  const getActivityIcon = (type: 'application' | 'interview') => {
    return type === 'application' ? FileText : Calendar;
  };

  // Dashboard customization
  const { widgets, reorderWidgets } = useDashboardStore();
  const { widgets: customWidgets } = useCustomWidgetsStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Check if dragging built-in widgets
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex);
        reorderWidgets(newWidgets);
      }
    }

    setActiveId(null);
  };

  // Combine built-in and custom widgets
  const allVisibleWidgets = useMemo(() => {
    const builtInWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

    const visibleCustomWidgets = customWidgets
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order);

    return [...builtInWidgets, ...visibleCustomWidgets];
  }, [widgets, customWidgets]);

  const renderWidget = (widgetId: string) => {
    // Check if it's a custom widget
    const customWidget = customWidgets.find((w) => w.id === widgetId);
    if (customWidget) {
      return <CustomWidgetRenderer widget={customWidget} />;
    }

    // Otherwise render built-in widget
    switch (widgetId as DashboardWidgetType) {
      case 'stats':
        return <StatsOverview />;

      case 'funnel':
        return <ApplicationFunnelChart />;

      case 'timeline':
        return <ApplicationsTimelineChart />;

      case 'status-distribution':
        return <StatusDistributionChart />;

      case 'response-metrics':
        return <ResponseMetricsCard />;

      case 'quick-actions':
        return (
          <AnimatedCard hoverEffect="lift" animateOnMount delay={0.1}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <ApplicationDialog
                trigger={
                  <AnimatedButton variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Application
                  </AnimatedButton>
                }
              />

              <InterviewDialog
                trigger={
                  <AnimatedButton variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </AnimatedButton>
                }
              />

              <Link to="/analytics" className="cursor-pointer">
                <AnimatedButton variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </AnimatedButton>
              </Link>

              <Link to="/applications" className="cursor-pointer">
                <AnimatedButton variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Applications
                </AnimatedButton>
              </Link>
            </CardContent>
          </AnimatedCard>
        );

      case 'recent-activity':
        return (
          <AnimatedCard hoverEffect="lift" animateOnMount delay={0.2}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet. Start by adding your first application!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item) => {
                    const Icon = getActivityIcon(item.type);
                    return (
                      <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        );

      case 'upcoming-interviews': {
        const upcomingInterviews = interviews
          .filter(
            (interview) => interview.scheduledAt && new Date(interview.scheduledAt) >= new Date(),
          )
          .sort((a, b) => {
            if (!a.scheduledAt || !b.scheduledAt) return 0;
            return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
          })
          .slice(0, 5);

        return (
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Interviews
              </CardTitle>
              <CardDescription>Scheduled and upcoming interviews</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming interviews scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingInterviews.map((interview) => {
                    const app = applications.find((a) => a.id === interview.applicationId);
                    return (
                      <div
                        key={interview.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium">{interview.type}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app?.companyName} - {app?.position}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {interview.scheduledAt &&
                                new Date(interview.scheduledAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {interview.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        );
      }

      case 'application-goals': {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const weeklyApps = applications.filter(
          (app) => new Date(app.createdAt) >= startOfWeek,
        ).length;
        const monthlyApps = applications.filter(
          (app) => new Date(app.createdAt) >= startOfMonth,
        ).length;

        const weeklyGoal = 10;
        const monthlyGoal = 40;
        const weeklyProgress = Math.min((weeklyApps / weeklyGoal) * 100, 100);
        const monthlyProgress = Math.min((monthlyApps / monthlyGoal) * 100, 100);

        return (
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Application Goals
              </CardTitle>
              <CardDescription>Track your weekly and monthly targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weekly Goal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weekly Goal</span>
                  <span className="text-sm text-muted-foreground">
                    {weeklyApps} / {weeklyGoal}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>
              </div>

              {/* Monthly Goal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Goal</span>
                  <span className="text-sm text-muted-foreground">
                    {monthlyApps} / {monthlyGoal}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${monthlyProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        );
      }

      case 'company-insights': {
        const companyData = applications.reduce(
          (acc, app) => {
            const company = app.companyName;
            if (!acc[company]) {
              acc[company] = {
                name: company,
                count: 0,
                statuses: [] as string[],
              };
            }
            acc[company].count++;
            acc[company].statuses.push(app.status);
            return acc;
          },
          {} as Record<string, { name: string; count: number; statuses: string[] }>,
        );

        const topCompanies = Object.values(companyData)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        return (
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Company Insights
              </CardTitle>
              <CardDescription>Research notes and company information</CardDescription>
            </CardHeader>
            <CardContent>
              {topCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Add notes and insights about companies you're targeting
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {topCompanies.map((company) => (
                    <div
                      key={company.name}
                      className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{company.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {company.count} {company.count === 1 ? 'application' : 'applications'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        );
      }

      case 'salary-tracker': {
        const salaryData = applications
          .filter((app) => app.salary && (app.salary.min || app.salary.max))
          .map((app) => {
            const avgSalary =
              app.salary?.min && app.salary?.max
                ? (app.salary.min + app.salary.max) / 2
                : app.salary?.min || app.salary?.max || 0;
            return {
              company: app.companyName,
              position: app.position,
              salary: avgSalary,
              salaryRange: app.salary,
              status: app.status,
            };
          })
          .sort((a, b) => b.salary - a.salary)
          .slice(0, 5);

        const avgSalary =
          salaryData.length > 0
            ? salaryData.reduce((sum, app) => sum + app.salary, 0) / salaryData.length
            : 0;

        return (
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">💰 Salary Tracker</CardTitle>
              <CardDescription>Compare salary ranges and offers</CardDescription>
            </CardHeader>
            <CardContent>
              {salaryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Add salary information to your applications to track compensation
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Average Salary</p>
                    <p className="text-2xl font-bold text-primary">
                      ${(avgSalary / 1000).toFixed(0)}K
                    </p>
                  </div>

                  <div className="space-y-2">
                    {salaryData.map((app, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{app.company}</p>
                          <p className="text-xs text-muted-foreground truncate">{app.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${(app.salary / 1000).toFixed(0)}K</p>
                          <Badge variant="outline" className="text-xs">
                            {app.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        );
      }

      case 'networking-tracker': {
        const referralApps = applications.filter(
          (app) =>
            app.notes?.toLowerCase().includes('referral') ||
            app.notes?.toLowerCase().includes('reference'),
        );
        const networkingApps = applications.filter(
          (app) =>
            app.notes?.toLowerCase().includes('network') ||
            app.notes?.toLowerCase().includes('connection'),
        );

        const totalConnections = referralApps.length + networkingApps.length;
        const referralResponseRate =
          referralApps.length > 0
            ? (referralApps.filter((app) => ['interview', 'offer', 'accepted'].includes(app.status))
                .length /
                referralApps.length) *
              100
            : 0;

        return (
          <AnimatedCard hoverEffect="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">👥 Networking Tracker</CardTitle>
              <CardDescription>Track connections and referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {totalConnections === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Add "referral" or "network" keywords to your application notes to track networking
                  efforts
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card border">
                      <p className="text-xs text-muted-foreground mb-1">Referrals</p>
                      <p className="text-2xl font-bold text-primary">{referralApps.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border">
                      <p className="text-xs text-muted-foreground mb-1">Connections</p>
                      <p className="text-2xl font-bold text-primary">{networkingApps.length}</p>
                    </div>
                  </div>

                  {referralApps.length > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Referral Response Rate</p>
                      <p className="text-xl font-bold text-primary">
                        {referralResponseRate.toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Recent Referrals</p>
                    {referralApps.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center gap-2 p-2 rounded border text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {app.companyName.charAt(0)}
                        </div>
                        <span className="flex-1 truncate">{app.companyName}</span>
                        <Badge variant="outline" className="text-xs">
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        );
      }

      default:
        return null;
    }
  };

  const getGridClass = (widgetId: string) => {
    // Check if it's a custom widget
    const customWidget = customWidgets.find((w) => w.id === widgetId);
    if (customWidget) {
      // Use size property for custom widgets
      if (customWidget.size === 'large') return 'col-span-full';
      if (customWidget.size === 'medium') return 'col-span-full md:col-span-1';
      return 'col-span-full md:col-span-1'; // small also takes half width
    }

    // Full width widgets
    if (widgetId === 'stats') return 'col-span-full';

    // Half width widgets (2 columns on md+)
    return 'col-span-full md:col-span-1';
  };

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <DashboardCustomizer />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allVisibleWidgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {allVisibleWidgets.map((widget) => (
              <div key={widget.id} className={getGridClass(widget.id)}>
                <DashboardWidgetWrapper id={widget.id}>
                  {renderWidget(widget.id)}
                </DashboardWidgetWrapper>
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="shadow-2xl ring-2 ring-primary/20 rounded-lg">
              {renderWidget(activeId)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
