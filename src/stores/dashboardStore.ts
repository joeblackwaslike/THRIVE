import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashboardWidgetType =
  | 'stats'
  | 'funnel'
  | 'timeline'
  | 'status-distribution'
  | 'response-metrics'
  | 'quick-actions'
  | 'recent-activity'
  | 'upcoming-interviews'
  | 'application-goals'
  | 'company-insights'
  | 'salary-tracker'
  | 'networking-tracker';

export interface DashboardWidget {
  id: DashboardWidgetType;
  title: string;
  description: string;
  visible: boolean;
  order: number;
}

interface DashboardState {
  widgets: DashboardWidget[];
  toggleWidget: (id: DashboardWidgetType) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  resetToDefault: () => void;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'stats',
    title: 'Statistics Overview',
    description: 'Key metrics at a glance',
    visible: true,
    order: 0,
  },
  {
    id: 'funnel',
    title: 'Application Funnel',
    description: 'Track your application pipeline',
    visible: true,
    order: 1,
  },
  {
    id: 'timeline',
    title: 'Applications Timeline',
    description: 'Applications over time',
    visible: true,
    order: 2,
  },
  {
    id: 'status-distribution',
    title: 'Status Distribution',
    description: 'Application status breakdown',
    visible: true,
    order: 3,
  },
  {
    id: 'response-metrics',
    title: 'Response Metrics',
    description: 'Response rate analytics',
    visible: true,
    order: 4,
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Common tasks and shortcuts',
    visible: true,
    order: 5,
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Latest updates and changes',
    visible: true,
    order: 6,
  },
  {
    id: 'upcoming-interviews',
    title: 'Upcoming Interviews',
    description: 'Schedule and prepare for interviews',
    visible: false,
    order: 7,
  },
  {
    id: 'application-goals',
    title: 'Application Goals',
    description: 'Track weekly and monthly targets',
    visible: false,
    order: 8,
  },
  {
    id: 'company-insights',
    title: 'Company Insights',
    description: 'Research and notes on companies',
    visible: false,
    order: 9,
  },
  {
    id: 'salary-tracker',
    title: 'Salary Tracker',
    description: 'Compare salary ranges and offers',
    visible: false,
    order: 10,
  },
  {
    id: 'networking-tracker',
    title: 'Networking Tracker',
    description: 'Track connections and referrals',
    visible: false,
    order: 11,
  },
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,

      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, visible: !widget.visible } : widget,
          ),
        })),

      reorderWidgets: (widgets) =>
        set({
          widgets: widgets.map((widget, index) => ({
            ...widget,
            order: index,
          })),
        }),

      resetToDefault: () =>
        set({
          widgets: defaultWidgets,
        }),
    }),
    {
      name: 'dashboard-layout',
    },
  ),
);
