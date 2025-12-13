import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Notification,
  NotificationSettings,
  NotificationStats,
  NotificationStatus,
  Reminder,
  SmartReminderSuggestion,
} from '@/types/notifications';

interface NotificationsState {
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  deleteNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;

  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;

  // Settings
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;

  // Utility
  getUnreadNotifications: () => Notification[];
  getPendingNotifications: () => Notification[];
  getUpcomingReminders: () => Reminder[];
  getStats: () => NotificationStats;
  checkAndTriggerReminders: () => void;

  // Smart suggestions
  smartSuggestions: SmartReminderSuggestion[];
  generateSmartSuggestions: (
    applications: Array<{
      id: string;
      status: string;
      appliedDate?: Date;
      companyName: string;
      lastContactDate?: Date;
    }>,
    interviews: Array<{
      id: string;
      scheduledAt?: Date;
      status: string;
      type: string;
      applicationId?: string;
    }>,
  ) => void;
  dismissSuggestion: (id: string) => void;
  acceptSuggestion: (suggestion: SmartReminderSuggestion) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  browserNotificationsEnabled: false,
  deadlineReminders: true,
  followUpReminders: true,
  interviewReminders: true,
  applicationUpdates: true,
  defaultReminderTime: '09:00',
  interviewReminderMinutes: 60,
  followUpReminderDays: 7,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  defaultSnoozeMinutes: 30,
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      reminders: [],
      settings: DEFAULT_SETTINGS,
      smartSuggestions: [],

      // Notifications
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...state.notifications,
          ],
        })),

      updateNotification: (id, updates) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n,
          ),
        })),

      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: 'read' as NotificationStatus,
                  readAt: new Date(),
                  updatedAt: new Date(),
                }
              : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.status === 'sent' || n.status === 'pending'
              ? {
                  ...n,
                  status: 'read' as NotificationStatus,
                  readAt: new Date(),
                  updatedAt: new Date(),
                }
              : n,
          ),
        })),

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: 'dismissed' as NotificationStatus,
                  dismissedAt: new Date(),
                  updatedAt: new Date(),
                }
              : n,
          ),
        })),

      snoozeNotification: (id, minutes) =>
        set((state) => {
          const now = new Date();
          const snoozedUntil = new Date(now.getTime() + minutes * 60000);
          return {
            notifications: state.notifications.map((n) =>
              n.id === id
                ? {
                    ...n,
                    status: 'snoozed' as NotificationStatus,
                    snoozedUntil,
                    updatedAt: new Date(),
                  }
                : n,
            ),
          };
        }),

      // Reminders
      addReminder: (reminder) =>
        set((state) => {
          const newReminder = {
            ...reminder,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            nextTrigger: reminder.reminderDate,
          };
          return {
            reminders: [...state.reminders, newReminder],
          };
        }),

      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r,
          ),
        })),

      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
          notifications: state.notifications.filter((n) => n.parentReminderId !== id),
        })),

      toggleReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date() } : r,
          ),
        })),

      // Settings
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Utility functions
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => n.status === 'sent' || n.status === 'pending');
      },

      getPendingNotifications: () => {
        const now = new Date();
        return get().notifications.filter(
          (n) =>
            n.status === 'pending' &&
            new Date(n.scheduledFor) <= now &&
            (!n.snoozedUntil || new Date(n.snoozedUntil) <= now),
        );
      },

      getUpcomingReminders: () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return get().reminders.filter(
          (r) =>
            r.isActive &&
            r.nextTrigger &&
            new Date(r.nextTrigger) >= now &&
            new Date(r.nextTrigger) <= tomorrow,
        );
      },

      getStats: () => {
        const { notifications } = get();
        const unreadCount = notifications.filter(
          (n) => n.status === 'sent' || n.status === 'pending',
        ).length;
        const pendingCount = notifications.filter((n) => n.status === 'pending').length;
        const snoozedCount = notifications.filter((n) => n.status === 'snoozed').length;

        const byType = notifications.reduce(
          (acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const byPriority = notifications.reduce(
          (acc, n) => {
            acc[n.priority] = (acc[n.priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const upcomingReminders = get().getUpcomingReminders().length;

        return {
          totalNotifications: notifications.length,
          unreadCount,
          pendingCount,
          snoozedCount,
          byType,
          byPriority,
          upcomingReminders,
        };
      },

      checkAndTriggerReminders: () => {
        const { reminders, addNotification, updateReminder, settings } = get();
        const now = new Date();

        reminders.forEach((reminder) => {
          if (!reminder.isActive || !reminder.nextTrigger || new Date(reminder.nextTrigger) > now) {
            return;
          }

          // Check quiet hours
          if (settings.quietHoursEnabled) {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
            const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
            const quietStart = startHour * 60 + startMin;
            const quietEnd = endHour * 60 + endMin;

            if (
              (quietStart < quietEnd && currentTime >= quietStart && currentTime < quietEnd) ||
              (quietStart > quietEnd && (currentTime >= quietStart || currentTime < quietEnd))
            ) {
              return; // Skip during quiet hours
            }
          }

          // Create notification
          addNotification({
            type: reminder.type,
            title: reminder.title,
            message: reminder.description || '',
            priority: reminder.priority,
            status: 'sent',
            scheduledFor: new Date(reminder.nextTrigger),
            sentAt: now,
            applicationId: reminder.applicationId,
            interviewId: reminder.interviewId,
            isRecurring: reminder.isRecurring,
            frequency: reminder.frequency,
            parentReminderId: reminder.id,
          });

          // Update reminder
          if (reminder.isRecurring && reminder.frequency) {
            const nextTrigger = new Date(reminder.nextTrigger);
            switch (reminder.frequency) {
              case 'daily':
                nextTrigger.setDate(nextTrigger.getDate() + 1);
                break;
              case 'weekly':
                nextTrigger.setDate(nextTrigger.getDate() + 7);
                break;
              case 'monthly':
                nextTrigger.setMonth(nextTrigger.getMonth() + 1);
                break;
            }

            if (!reminder.endDate || nextTrigger <= new Date(reminder.endDate)) {
              updateReminder(reminder.id, {
                lastTriggered: now,
                nextTrigger,
              });
            } else {
              updateReminder(reminder.id, {
                isActive: false,
                completedAt: now,
              });
            }
          } else {
            updateReminder(reminder.id, {
              isActive: false,
              completedAt: now,
              lastTriggered: now,
            });
          }

          // Trigger browser notification if enabled
          if (
            settings.browserNotificationsEnabled &&
            reminder.notifyVia.includes('browser') &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(reminder.title, {
              body: reminder.description,
              icon: '/favicon.ico',
              tag: reminder.id,
            });
          }
        });
      },

      // Smart suggestions
      generateSmartSuggestions: (applications, interviews) => {
        const suggestions: SmartReminderSuggestion[] = [];
        const now = new Date();

        // Follow-up suggestions for applications
        applications.forEach((app) => {
          if (app.status === 'applied' && app.appliedDate) {
            const appliedDate = new Date(app.appliedDate);
            const daysSinceApplied = Math.floor(
              (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysSinceApplied >= 7 && daysSinceApplied <= 10) {
              suggestions.push({
                id: `follow-up-${app.id}`,
                type: 'follow-up',
                title: `Follow up with ${app.companyName}`,
                description: `It's been ${daysSinceApplied} days since you applied. Consider following up.`,
                suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                applicationId: app.id,
                priority: 'medium',
                reason: `${daysSinceApplied} days since application`,
              });
            }
          }
        });

        // Interview prep suggestions
        interviews.forEach((interview) => {
          if (interview.scheduledAt && interview.status === 'scheduled') {
            const interviewDate = new Date(interview.scheduledAt);
            const daysUntilInterview = Math.floor(
              (interviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysUntilInterview >= 1 && daysUntilInterview <= 3) {
              suggestions.push({
                id: `prep-${interview.id}`,
                type: 'interview-prep',
                title: `Prepare for ${interview.type} interview`,
                description: `Interview in ${daysUntilInterview} days. Start preparing now.`,
                suggestedDate: new Date(interviewDate.getTime() - 24 * 60 * 60 * 1000), // Day before
                interviewId: interview.id,
                applicationId: interview.applicationId,
                priority: 'high',
                reason: `Interview in ${daysUntilInterview} days`,
              });
            }
          }
        });

        // Check status suggestions for long-waiting applications
        applications.forEach((app) => {
          if (app.status === 'interviewing' && app.lastContactDate) {
            const lastContact = new Date(app.lastContactDate);
            const daysSinceContact = Math.floor(
              (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysSinceContact >= 14) {
              suggestions.push({
                id: `status-${app.id}`,
                type: 'check-status',
                title: `Check status with ${app.companyName}`,
                description: `No contact for ${daysSinceContact} days. Check on interview status.`,
                suggestedDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                applicationId: app.id,
                priority: 'medium',
                reason: `${daysSinceContact} days since last contact`,
              });
            }
          }
        });

        set({ smartSuggestions: suggestions });
      },

      dismissSuggestion: (id) =>
        set((state) => ({
          smartSuggestions: state.smartSuggestions.filter((s) => s.id !== id),
        })),

      acceptSuggestion: (suggestion) => {
        const { addReminder, dismissSuggestion } = get();
        addReminder({
          title: suggestion.title,
          description: suggestion.description,
          type:
            suggestion.type === 'interview-prep'
              ? 'interview'
              : suggestion.type === 'check-status'
                ? 'follow-up'
                : suggestion.type,
          priority: suggestion.priority,
          reminderDate: suggestion.suggestedDate,
          isRecurring: false,
          applicationId: suggestion.applicationId,
          interviewId: suggestion.interviewId,
          notifyVia: ['app', 'browser'],
          isActive: true,
        });
        dismissSuggestion(suggestion.id);
      },
    }),
    {
      name: 'notifications-storage',
    },
  ),
);
