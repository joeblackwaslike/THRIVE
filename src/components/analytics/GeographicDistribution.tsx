import { isWithinInterval } from 'date-fns';
import { Building2, Globe, Home, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { calculateLocationDistribution, calculateWorkTypeDistribution } from '@/lib/analytics';
import { useApplicationsStore } from '@/stores/applicationsStore';

interface GeographicDistributionProps {
  period?: {
    start: Date;
    end: Date;
  };
}

const WORK_TYPE_COLORS: Record<string, string> = {
  remote: '#10b981',
  hybrid: '#3b82f6',
  'on-site': '#f59e0b',
  unspecified: '#6b7280',
};

const WORK_TYPE_ICONS: Record<string, typeof MapPin> = {
  remote: Home,
  hybrid: Globe,
  'on-site': Building2,
  unspecified: MapPin,
};

export function GeographicDistribution({ period }: GeographicDistributionProps = {}) {
  const { applications } = useApplicationsStore();
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(null);

  // Filter applications by period if provided
  const filteredApplications = useMemo(() => {
    if (!period) return applications;

    return applications.filter((app) => {
      const appDate = new Date(app.appliedDate || app.createdAt);
      return isWithinInterval(appDate, { start: period.start, end: period.end });
    });
  }, [applications, period]);

  // Further filter by work type if selected
  const workTypeFilteredApps = useMemo(() => {
    if (!selectedWorkType) return filteredApplications;
    return filteredApplications.filter((app) => app.workType === selectedWorkType);
  }, [filteredApplications, selectedWorkType]);

  const locationDistribution = useMemo(
    () => calculateLocationDistribution(workTypeFilteredApps),
    [workTypeFilteredApps],
  );

  const workTypeDistribution = useMemo(
    () => calculateWorkTypeDistribution(filteredApplications),
    [filteredApplications],
  );

  const hasLocationData = locationDistribution.length > 0;
  const hasWorkTypeData = workTypeDistribution.length > 0;

  // Prepare pie chart data for work types
  const pieData = workTypeDistribution.map((item) => ({
    name: item.workType.charAt(0).toUpperCase() + item.workType.slice(1).replace('-', ' '),
    value: item.total,
    color: WORK_TYPE_COLORS[item.workType] || WORK_TYPE_COLORS.unspecified,
  }));

  if (!hasLocationData && !hasWorkTypeData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geographic & Work Type Distribution</CardTitle>
          <CardDescription>
            Application distribution by location and work arrangement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <MapPin className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">No geographic data available</p>
            <p className="text-xs mt-1">Location data will appear as you add applications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="work-type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="work-type">Work Type</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
        </TabsList>

        {/* Work Type Tab */}
        <TabsContent value="work-type" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Work Type Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Work Type Distribution</CardTitle>
                <CardDescription>Breakdown by remote, hybrid, and on-site</CardDescription>
              </CardHeader>
              <CardContent>
                {hasWorkTypeData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                    No work type data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Type Success Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Work Type</CardTitle>
                <CardDescription>Performance across different work arrangements</CardDescription>
              </CardHeader>
              <CardContent>
                {hasWorkTypeData ? (
                  <div className="space-y-4">
                    {workTypeDistribution.map((item) => {
                      const Icon = WORK_TYPE_ICONS[item.workType] || MapPin;
                      return (
                        <div key={item.workType} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium capitalize">
                                {item.workType.replace('-', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                {item.total} apps
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {item.successRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${item.successRate}%`,
                                backgroundColor: WORK_TYPE_COLORS[item.workType],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                    No work type data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Applications by Location</CardTitle>
              <CardDescription>
                Top locations {selectedWorkType && `(filtered by ${selectedWorkType})`}
                {selectedWorkType && (
                  <button
                    type="button"
                    onClick={() => setSelectedWorkType(null)}
                    className="ml-2 text-primary hover:underline text-xs"
                  >
                    Clear filter
                  </button>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Work Type Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {workTypeDistribution.map((item) => {
                  const Icon = WORK_TYPE_ICONS[item.workType] || MapPin;
                  return (
                    <button
                      key={item.workType}
                      type="button"
                      onClick={() =>
                        setSelectedWorkType(
                          selectedWorkType === item.workType ? null : item.workType,
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        selectedWorkType === item.workType
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="capitalize">{item.workType.replace('-', ' ')}</span>
                      <span className="text-xs opacity-75">({item.total})</span>
                    </button>
                  );
                })}
              </div>

              {hasLocationData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={locationDistribution.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="location"
                      className="text-xs"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.location}</p>
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
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total Applications" />
                    <Bar dataKey="successful" fill="#10b981" name="Successful" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
                  No location data for selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
