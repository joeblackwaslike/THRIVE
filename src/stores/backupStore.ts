import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BackupRecord {
  id: string;
  timestamp: Date;
  filename: string;
  recordCount: number;
  size: number; // in bytes
  type: 'manual' | 'automatic';
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastBackup?: Date;
  maxBackups: number; // Maximum number of backups to keep
}

interface BackupState {
  backupHistory: BackupRecord[];
  settings: BackupSettings;

  // Actions
  addBackupRecord: (record: Omit<BackupRecord, 'id'>) => void;
  removeBackupRecord: (id: string) => void;
  clearBackupHistory: () => void;
  updateSettings: (settings: Partial<BackupSettings>) => void;
  getRecentBackups: (limit?: number) => BackupRecord[];
}

const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  frequency: 'weekly',
  maxBackups: 10,
};

export const useBackupStore = create<BackupState>()(
  persist(
    (set, get) => ({
      backupHistory: [],
      settings: DEFAULT_SETTINGS,

      addBackupRecord: (record) => {
        const newRecord: BackupRecord = {
          ...record,
          id: crypto.randomUUID(),
        };

        set((state) => {
          const history = [newRecord, ...state.backupHistory];

          // Trim history to maxBackups
          const trimmed = history.slice(0, state.settings.maxBackups);

          return {
            backupHistory: trimmed,
            settings: {
              ...state.settings,
              lastBackup: newRecord.timestamp,
            },
          };
        });
      },

      removeBackupRecord: (id) => {
        set((state) => ({
          backupHistory: state.backupHistory.filter((record) => record.id !== id),
        }));
      },

      clearBackupHistory: () => {
        set({ backupHistory: [] });
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },

      getRecentBackups: (limit = 5) => {
        return get().backupHistory.slice(0, limit);
      },
    }),
    {
      name: 'thrive-backup-storage',
      partialize: (state) => ({
        backupHistory: state.backupHistory,
        settings: state.settings,
      }),
    },
  ),
);

/**
 * Check if a backup is due based on settings
 */
export function isBackupDue(settings: BackupSettings): boolean {
  if (!settings.enabled || !settings.lastBackup) {
    return settings.enabled; // If enabled and never backed up, it's due
  }

  const now = new Date();
  const lastBackup = new Date(settings.lastBackup);
  const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

  switch (settings.frequency) {
    case 'daily':
      return hoursSinceLastBackup >= 24;
    case 'weekly':
      return hoursSinceLastBackup >= 24 * 7;
    case 'monthly':
      return hoursSinceLastBackup >= 24 * 30;
    default:
      return false;
  }
}
