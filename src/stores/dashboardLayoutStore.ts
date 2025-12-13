import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetId =
  | 'stats-overview'
  | 'timeline-chart'
  | 'status-distribution'
  | 'funnel-chart'
  | 'response-time'
  | 'interview-stage'
  | 'company-stats'
  | 'monthly-trends'
  | 'goals-tracking'
  | 'filters'
  | 'export-options'
  | 'report-generator'
  | 'annotations';

export interface WidgetConfig {
  id: WidgetId;
  name: string;
  description: string;
  defaultVisible: boolean;
  gridSpan?: 'full' | 'half' | 'third';
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: WidgetId[];
  widgetVisibility: Record<WidgetId, boolean>;
}

export const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: 'stats-overview',
    name: 'Stats Overview',
    description: 'Key metrics cards',
    defaultVisible: true,
    gridSpan: 'full',
  },
  {
    id: 'timeline-chart',
    name: 'Application Timeline',
    description: 'Track applications over time',
    defaultVisible: true,
    gridSpan: 'full',
  },
  {
    id: 'status-distribution',
    name: 'Status Distribution',
    description: 'Pie chart of application statuses',
    defaultVisible: true,
    gridSpan: 'half',
  },
  {
    id: 'funnel-chart',
    name: 'Application Funnel',
    description: 'Progression through stages',
    defaultVisible: true,
    gridSpan: 'half',
  },
  {
    id: 'response-time',
    name: 'Response Time',
    description: 'Average response time analysis',
    defaultVisible: true,
    gridSpan: 'half',
  },
  {
    id: 'interview-stage',
    name: 'Interview Stages',
    description: 'Interview progression breakdown',
    defaultVisible: true,
    gridSpan: 'half',
  },
  {
    id: 'company-stats',
    name: 'Company Performance',
    description: 'Top performing companies',
    defaultVisible: false,
    gridSpan: 'full',
  },
  {
    id: 'monthly-trends',
    name: 'Monthly Trends',
    description: '6-month trend analysis',
    defaultVisible: false,
    gridSpan: 'full',
  },
  {
    id: 'goals-tracking',
    name: 'Goals Tracking',
    description: 'Track your application goals',
    defaultVisible: false,
    gridSpan: 'full',
  },
  {
    id: 'filters',
    name: 'Filters',
    description: 'Filter dashboard data',
    defaultVisible: true,
    gridSpan: 'full',
  },
  {
    id: 'export-options',
    name: 'Export Options',
    description: 'Export analytics data',
    defaultVisible: false,
    gridSpan: 'full',
  },
  {
    id: 'report-generator',
    name: 'Automated Reports',
    description: 'Generate periodic reports',
    defaultVisible: false,
    gridSpan: 'full',
  },
  {
    id: 'annotations',
    name: 'Annotations',
    description: 'Notes, milestones, and event markers',
    defaultVisible: false,
    gridSpan: 'full',
  },
];

export const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Default View',
    description: 'Standard analytics dashboard',
    widgets: [
      'stats-overview',
      'filters',
      'timeline-chart',
      'status-distribution',
      'funnel-chart',
      'response-time',
      'interview-stage',
    ],
    widgetVisibility: AVAILABLE_WIDGETS.reduce(
      (acc, widget) => {
        acc[widget.id] = widget.defaultVisible;
        return acc;
      },
      {} as Record<WidgetId, boolean>,
    ),
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Essential metrics only',
    widgets: ['stats-overview', 'timeline-chart', 'status-distribution'],
    widgetVisibility: {
      'stats-overview': true,
      'timeline-chart': true,
      'status-distribution': true,
      'funnel-chart': false,
      'response-time': false,
      'interview-stage': false,
      'company-stats': false,
      'monthly-trends': false,
      'goals-tracking': false,
      filters: false,
      'export-options': false,
      'report-generator': false,
      annotations: false,
    },
  },
  {
    id: 'detailed',
    name: 'Detailed View',
    description: 'All available widgets',
    widgets: AVAILABLE_WIDGETS.map((w) => w.id),
    widgetVisibility: AVAILABLE_WIDGETS.reduce(
      (acc, widget) => {
        acc[widget.id] = true;
        return acc;
      },
      {} as Record<WidgetId, boolean>,
    ),
  },
  {
    id: 'performance',
    name: 'Performance Focus',
    description: 'Focus on metrics and trends',
    widgets: ['stats-overview', 'monthly-trends', 'company-stats', 'response-time', 'funnel-chart'],
    widgetVisibility: {
      'stats-overview': true,
      'timeline-chart': false,
      'status-distribution': false,
      'funnel-chart': true,
      'response-time': true,
      'interview-stage': false,
      'company-stats': true,
      'monthly-trends': true,
      'goals-tracking': false,
      filters: false,
      'export-options': false,
      'report-generator': false,
      annotations: false,
    },
  },
];

interface DashboardLayoutState {
  currentLayoutId: string;
  customLayouts: DashboardLayout[];

  // Getters
  getCurrentLayout: () => DashboardLayout;
  getVisibleWidgets: () => WidgetId[];

  // Layout management
  setCurrentLayout: (layoutId: string) => void;
  createCustomLayout: (name: string, description: string, basedOn?: string) => void;
  deleteCustomLayout: (layoutId: string) => void;
  duplicateLayout: (layoutId: string, newName: string) => void;

  // Widget management
  toggleWidgetVisibility: (widgetId: WidgetId) => void;
  reorderWidgets: (newOrder: WidgetId[]) => void;
  resetToDefault: () => void;
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      currentLayoutId: 'default',
      customLayouts: [],

      getCurrentLayout: () => {
        const { currentLayoutId, customLayouts } = get();
        const customLayout = customLayouts.find((l) => l.id === currentLayoutId);
        if (customLayout) return customLayout;

        const defaultLayout = DEFAULT_LAYOUTS.find((l) => l.id === currentLayoutId);
        return defaultLayout || DEFAULT_LAYOUTS[0];
      },

      getVisibleWidgets: () => {
        const layout = get().getCurrentLayout();
        return layout.widgets.filter((widgetId) => layout.widgetVisibility[widgetId]);
      },

      setCurrentLayout: (layoutId: string) => {
        set({ currentLayoutId: layoutId });
      },

      createCustomLayout: (name: string, description: string, basedOn?: string) => {
        const { customLayouts } = get();
        const baseLayout = basedOn ? get().getCurrentLayout() : DEFAULT_LAYOUTS[0];

        const newLayout: DashboardLayout = {
          id: `custom-${Date.now()}`,
          name,
          description,
          widgets: [...baseLayout.widgets],
          widgetVisibility: { ...baseLayout.widgetVisibility },
        };

        set({
          customLayouts: [...customLayouts, newLayout],
          currentLayoutId: newLayout.id,
        });
      },

      deleteCustomLayout: (layoutId: string) => {
        const { customLayouts, currentLayoutId } = get();
        const filtered = customLayouts.filter((l) => l.id !== layoutId);

        set({
          customLayouts: filtered,
          currentLayoutId: currentLayoutId === layoutId ? 'default' : currentLayoutId,
        });
      },

      duplicateLayout: (layoutId: string, newName: string) => {
        const { customLayouts } = get();
        const layoutToDuplicate =
          customLayouts.find((l) => l.id === layoutId) ||
          DEFAULT_LAYOUTS.find((l) => l.id === layoutId);

        if (!layoutToDuplicate) return;

        const newLayout: DashboardLayout = {
          id: `custom-${Date.now()}`,
          name: newName,
          description: `Copy of ${layoutToDuplicate.name}`,
          widgets: [...layoutToDuplicate.widgets],
          widgetVisibility: { ...layoutToDuplicate.widgetVisibility },
        };

        set({
          customLayouts: [...customLayouts, newLayout],
          currentLayoutId: newLayout.id,
        });
      },

      toggleWidgetVisibility: (widgetId: WidgetId) => {
        const { currentLayoutId, customLayouts } = get();
        const isCustomLayout = customLayouts.some((l) => l.id === currentLayoutId);

        if (!isCustomLayout) {
          // Create a custom layout based on current
          const currentLayout = get().getCurrentLayout();
          const newLayout: DashboardLayout = {
            id: `custom-${Date.now()}`,
            name: `${currentLayout.name} (Modified)`,
            description: `Modified from ${currentLayout.name}`,
            widgets: [...currentLayout.widgets],
            widgetVisibility: {
              ...currentLayout.widgetVisibility,
              [widgetId]: !currentLayout.widgetVisibility[widgetId],
            },
          };

          set({
            customLayouts: [...customLayouts, newLayout],
            currentLayoutId: newLayout.id,
          });
        } else {
          // Update existing custom layout
          set({
            customLayouts: customLayouts.map((layout) =>
              layout.id === currentLayoutId
                ? {
                    ...layout,
                    widgetVisibility: {
                      ...layout.widgetVisibility,
                      [widgetId]: !layout.widgetVisibility[widgetId],
                    },
                  }
                : layout,
            ),
          });
        }
      },

      reorderWidgets: (newOrder: WidgetId[]) => {
        const { currentLayoutId, customLayouts } = get();
        const isCustomLayout = customLayouts.some((l) => l.id === currentLayoutId);

        if (!isCustomLayout) {
          // Create a custom layout with new order
          const currentLayout = get().getCurrentLayout();
          const newLayout: DashboardLayout = {
            id: `custom-${Date.now()}`,
            name: `${currentLayout.name} (Reordered)`,
            description: `Reordered from ${currentLayout.name}`,
            widgets: newOrder,
            widgetVisibility: { ...currentLayout.widgetVisibility },
          };

          set({
            customLayouts: [...customLayouts, newLayout],
            currentLayoutId: newLayout.id,
          });
        } else {
          // Update existing custom layout
          set({
            customLayouts: customLayouts.map((layout) =>
              layout.id === currentLayoutId ? { ...layout, widgets: newOrder } : layout,
            ),
          });
        }
      },

      resetToDefault: () => {
        set({ currentLayoutId: 'default', customLayouts: [] });
      },
    }),
    {
      name: 'dashboard-layout-storage',
    },
  ),
);
