import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, ActivityType } from '@/types/activity';

interface ActivityStore {
  activities: Activity[];

  // Actions
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Activity;
  getActivitiesByEntity: (entityId: string, entityType?: Activity['entityType']) => Activity[];
  getRecentActivities: (limit?: number) => Activity[];
  getActivitiesByType: (type: ActivityType) => Activity[];
  clearOldActivities: (daysToKeep?: number) => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => ({
          activities: [newActivity, ...state.activities],
        }));

        return newActivity;
      },

      getActivitiesByEntity: (entityId, entityType) => {
        return get().activities.filter(
          (activity) =>
            activity.entityId === entityId &&
            (entityType === undefined || activity.entityType === entityType),
        );
      },

      getRecentActivities: (limit = 50) => {
        return get().activities.slice(0, limit);
      },

      getActivitiesByType: (type) => {
        return get().activities.filter((activity) => activity.type === type);
      },

      clearOldActivities: (daysToKeep = 90) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        set((state) => ({
          activities: state.activities.filter(
            (activity) => new Date(activity.timestamp) > cutoffDate,
          ),
        }));
      },
    }),
    {
      name: 'thrive-activities',
      version: 1,
    },
  ),
);
