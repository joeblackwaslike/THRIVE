import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Widget query types
export type QueryType =
  | 'count' // Count applications/interviews
  | 'list' // Show list of items
  | 'chart' // Show chart data
  | 'stat'; // Show single statistic

export type FilterField =
  | 'status'
  | 'companyName'
  | 'position'
  | 'createdAt'
  | 'appliedDate'
  | 'salary'
  | 'workType'
  | 'priority'
  | 'tags';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in';

export interface WidgetFilter {
  field: FilterField;
  operator: FilterOperator;
  value: string | number | string[];
}

export interface CustomWidget {
  id: string;
  title: string;
  description: string;
  queryType: QueryType;
  dataSource: 'applications' | 'interviews';

  // Filters
  filters: WidgetFilter[];

  // Display options
  displayType: 'number' | 'list' | 'bar-chart' | 'pie-chart' | 'line-chart' | 'table';
  colorScheme?: 'primary' | 'success' | 'warning' | 'danger';
  icon?: string;

  // Layout
  size: 'small' | 'medium' | 'large'; // small = 1 col, medium = 1 col, large = 2 cols

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  visible: boolean;
  order: number;
}

interface CustomWidgetsState {
  widgets: CustomWidget[];
  addWidget: (widget: Omit<CustomWidget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWidget: (id: string, updates: Partial<CustomWidget>) => void;
  deleteWidget: (id: string) => void;
  toggleWidget: (id: string) => void;
  reorderWidgets: (widgets: CustomWidget[]) => void;
}

export const useCustomWidgetsStore = create<CustomWidgetsState>()(
  persist(
    (set) => ({
      widgets: [],

      addWidget: (widget) =>
        set((state) => {
          const newWidget: CustomWidget = {
            ...widget,
            id: `custom-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            order: state.widgets.length,
          };
          return { widgets: [...state.widgets, newWidget] };
        }),

      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, ...updates, updatedAt: new Date() } : widget,
          ),
        })),

      deleteWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
        })),

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
    }),
    {
      name: 'custom-widgets',
    },
  ),
);
