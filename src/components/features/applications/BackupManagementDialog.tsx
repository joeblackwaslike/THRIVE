import { AlertCircle, CheckCircle2, Clock, Download, HardDrive, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useConfirm } from '@/hooks/useConfirm';
import { exportBackup, formatBytes } from '@/lib/backup';
import { notify } from '@/lib/notifications';
import { formatDate } from '@/lib/utils';
import { useApplicationsStore } from '@/stores';
import { isBackupDue, useBackupStore } from '@/stores/backupStore';

interface BackupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupManagementDialog({ open, onOpenChange }: BackupManagementDialogProps) {
  const { applications } = useApplicationsStore();
  const {
    backupHistory,
    settings,
    addBackupRecord,
    removeBackupRecord,
    clearBackupHistory,
    updateSettings,
  } = useBackupStore();
  const { confirm } = useConfirm();

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const backupDue = isBackupDue(settings);

  const handleCreateBackup = useCallback(async () => {
    setIsCreatingBackup(true);
    try {
      const { filename, size } = exportBackup(applications);

      addBackupRecord({
        timestamp: new Date(),
        filename,
        recordCount: applications.length,
        size,
        type: 'manual',
      });

      toast.success('Backup Created', {
        description: `Backed up ${applications.length} applications (${formatBytes(size)})`,
      });
    } catch (error) {
      toast.error('Backup Failed', {
        description: 'Failed to create backup',
      });
      console.error('Backup error:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  }, [applications, addBackupRecord]);

  const handleDeleteBackup = useCallback(
    (id: string) => {
      removeBackupRecord(id);
      toast.success('Backup Deleted', {
        description: 'Backup record removed from history',
      });
    },
    [removeBackupRecord],
  );

  const handleClearHistory = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Clear Backup History',
      description: 'Are you sure you want to clear all backup history? This cannot be undone.',
      type: 'danger',
      confirmText: 'Clear',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      clearBackupHistory();
      toast.success('History Cleared', {
        description: 'All backup records removed',
      });
    }
  }, [confirm, clearBackupHistory]);

  // Check for due backups on mount
  useEffect(() => {
    if (open && backupDue && applications.length > 0) {
      notify.backupReminder(
        'Backup Due',
        'Your scheduled backup is due. Consider creating a backup.',
      );
    }
  }, [open, backupDue, applications.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Backup Management</DialogTitle>
          <DialogDescription>Manage automatic backups and view backup history</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-6">
          {/* Backup Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Automatic Backups</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically remind to backup your data
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked: boolean) => updateSettings({ enabled: checked })}
              />
            </div>

            {settings.enabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="min-w-[100px]">Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                      updateSettings({ frequency: value })
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <Label className="min-w-[100px]">Max Backups</Label>
                  <Select
                    value={String(settings.maxBackups)}
                    onValueChange={(value) =>
                      updateSettings({ maxBackups: Number.parseInt(value, 10) })
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Keep 5 backups</SelectItem>
                      <SelectItem value="10">Keep 10 backups</SelectItem>
                      <SelectItem value="20">Keep 20 backups</SelectItem>
                      <SelectItem value="50">Keep 50 backups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.lastBackup && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Last backup: {formatDate(settings.lastBackup)}</span>
                    {backupDue && (
                      <Badge variant="destructive" className="ml-2">
                        Backup Due
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create Backup */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Create Backup</h3>
                <p className="text-sm text-muted-foreground">
                  {applications.length} applications ready to backup
                </p>
              </div>
            </div>
            <AnimatedButton
              onClick={handleCreateBackup}
              loading={isCreatingBackup}
              loadingText="Creating..."
              disabled={applications.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Create Backup
            </AnimatedButton>
          </div>

          {/* Backup History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Backup History</h3>
              {backupHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              )}
            </div>

            {backupHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <HardDrive className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No backups yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first backup to get started
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {backupHistory.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            backup.type === 'automatic'
                              ? 'bg-blue-100 dark:bg-blue-950'
                              : 'bg-green-100 dark:bg-green-950'
                          }`}
                        >
                          {backup.type === 'automatic' ? (
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{backup.filename}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatDate(backup.timestamp)}</span>
                            <span>•</span>
                            <span>{backup.recordCount} records</span>
                            <span>•</span>
                            <span>{formatBytes(backup.size)}</span>
                          </div>
                        </div>
                        <Badge variant={backup.type === 'automatic' ? 'secondary' : 'outline'}>
                          {backup.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">About Backups</p>
              <p className="text-blue-700 dark:text-blue-300">
                Backups are stored locally in your browser. To restore data, use the "Import from
                JSON" option in the Applications table. History only tracks metadata - actual backup
                files must be kept safe manually.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
