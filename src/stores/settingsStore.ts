import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'fa';
export type CalendarType = 'gregorian' | 'persian';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';

export interface NotificationSettings {
  backupReminders: boolean;
  statusChanges: boolean;
  deadlineAlerts: boolean;
  interviewReminders: boolean;
  emailNotifications: boolean;
}

export interface DisplaySettings {
  theme: Theme;
  language: Language;
  calendarType: CalendarType;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  compactMode: boolean;
  showAvatars: boolean;
}

export interface DataSettings {
  defaultView: 'table' | 'kanban';
  itemsPerPage: 10 | 25 | 50 | 100;
  autoSave: boolean;
  confirmDelete: boolean;
}

export interface DocumentSettings {
  autoDeleteDays: number; // Days before permanently deleting soft-deleted documents
  recentlyDeletedDays: number; // Days to show documents in "Recently Deleted" tab
}

export interface DemoModeSettings {
  enabled: boolean; // Whether demo mode is currently active
  hasUserData: boolean; // Whether there was user data when demo mode was enabled
}

interface SettingsState {
  display: DisplaySettings;
  notifications: NotificationSettings;
  data: DataSettings;
  documents: DocumentSettings;
  demoMode: DemoModeSettings;

  // Actions
  updateDisplay: (settings: Partial<DisplaySettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateData: (settings: Partial<DataSettings>) => void;
  updateDocuments: (settings: Partial<DocumentSettings>) => void;
  updateDemoMode: (settings: Partial<DemoModeSettings>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_DISPLAY: DisplaySettings = {
  theme: 'system',
  language: 'en',
  calendarType: 'gregorian',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  compactMode: false,
  showAvatars: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  backupReminders: true,
  statusChanges: true,
  deadlineAlerts: true,
  interviewReminders: true,
  emailNotifications: false,
};

const DEFAULT_DATA: DataSettings = {
  defaultView: 'table',
  itemsPerPage: 25,
  autoSave: true,
  confirmDelete: true,
};

const DEFAULT_DOCUMENTS: DocumentSettings = {
  autoDeleteDays: 7,
  recentlyDeletedDays: 7,
};

const DEFAULT_DEMO_MODE: DemoModeSettings = {
  enabled: false,
  hasUserData: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      display: DEFAULT_DISPLAY,
      notifications: DEFAULT_NOTIFICATIONS,
      data: DEFAULT_DATA,
      documents: DEFAULT_DOCUMENTS,
      demoMode: DEFAULT_DEMO_MODE,

      updateDisplay: (settings) => {
        set((state) => ({
          display: { ...state.display, ...settings },
        }));
      },

      updateNotifications: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        }));
      },

      updateData: (settings) => {
        set((state) => ({
          data: { ...state.data, ...settings },
        }));
      },

      updateDocuments: (settings) => {
        set((state) => ({
          documents: { ...state.documents, ...settings },
        }));
      },

      updateDemoMode: (settings) => {
        set((state) => ({
          demoMode: { ...state.demoMode, ...settings },
        }));
      },

      resetToDefaults: () => {
        set({
          display: DEFAULT_DISPLAY,
          notifications: DEFAULT_NOTIFICATIONS,
          data: DEFAULT_DATA,
          documents: DEFAULT_DOCUMENTS,
          demoMode: DEFAULT_DEMO_MODE,
        });
      },
    }),
    {
      name: 'thrive-settings',
    },
  ),
);
