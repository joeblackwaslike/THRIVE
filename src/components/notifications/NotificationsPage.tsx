import { Bell, Calendar, Clock, Settings, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationsList } from '@/components/notifications/NotificationsList';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApplicationsStore } from '@/stores/applicationsStore';
import { useInterviewsStore } from '@/stores/interviewsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('notifications');

  const stats = useNotificationsStore((state) => state.getStats());
  const checkAndTriggerReminders = useNotificationsStore((state) => state.checkAndTriggerReminders);
  const generateSmartSuggestions = useNotificationsStore((state) => state.generateSmartSuggestions);
  const applications = useApplicationsStore((state) => state.applications);
  const interviews = useInterviewsStore((state) => state.interviews);
  const smartSuggestions = useNotificationsStore((state) => state.smartSuggestions);

  // Check for reminders every minute
  useEffect(() => {
    checkAndTriggerReminders();
    const interval = setInterval(() => {
      checkAndTriggerReminders();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAndTriggerReminders]);

  // Generate smart suggestions when data changes
  useEffect(() => {
    generateSmartSuggestions(
      applications.map((app) => ({
        id: app.id,
        status: app.status,
        appliedDate: app.appliedDate,
        companyName: app.companyName,
        lastContactDate: app.appliedDate, // Use appliedDate as fallback for lastContactDate
      })),
      interviews.map((interview) => ({
        id: interview.id,
        scheduledAt: interview.scheduledAt,
        status: interview.status,
        type: interview.type,
        applicationId: interview.applicationId,
      })),
    );
  }, [applications, interviews, generateSmartSuggestions]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications & Reminders</h1>
          <p className="text-muted-foreground mt-1">Stay on top of your job search activities</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadCount}</div>
            <p className="text-xs text-muted-foreground">{stats.totalNotifications} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingReminders}</div>
            <p className="text-xs text-muted-foreground">Next 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{smartSuggestions.length}</div>
            <p className="text-xs text-muted-foreground">Smart reminders</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Suggestions */}
      {/* TODO: Implement SmartSuggestions component */}
      {/* {smartSuggestions.length > 0 && (
        <SmartSuggestions />
      )} */}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            {stats.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {stats.unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsList />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          {/* TODO: Implement RemindersList component */}
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reminders feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* TODO: Implement NotificationSettings component */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
