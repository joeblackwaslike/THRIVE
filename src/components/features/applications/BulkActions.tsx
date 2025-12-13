import { ChevronDown, Download, Edit, Flag, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { APPLICATION_STATUSES, PRIORITY_LEVELS } from '@/lib/constants';
import { useApplicationsStore } from '@/stores';
import type { Application, ApplicationStatus } from '@/types';

interface BulkActionsProps {
  selectedRows: Application[];
  onClearSelection: () => void;
}

export function BulkActions({ selectedRows, onClearSelection }: BulkActionsProps) {
  const { updateApplication, deleteApplication } = useApplicationsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const selectedCount = selectedRows.length;

  // Helper to process items in rate-limited batches
  const processBatch = async <T,>(
    items: T[],
    processor: (item: T) => Promise<void>,
    batchSize: number = 5,
    delayMs: number = 50,
  ): Promise<void> => {
    const total = items.length;
    let completed = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Process batch in parallel
      await Promise.all(batch.map(processor));

      completed += batch.length;
      setProgress((completed / total) * 100);

      // Add delay between batches to prevent overwhelming the database
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };

  // Bulk delete handler with rate limiting
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(`Deleting ${selectedCount} applications...`);

    try {
      await processBatch(
        selectedRows,
        async (row) => {
          await deleteApplication(row.id);
        },
        5, // Process 5 at a time
        50, // 50ms delay between batches
      );

      toast.success('Success', {
        description: `Deleted ${selectedCount} application${selectedCount > 1 ? 's' : ''}`,
      });
      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting applications:', error);
      toast.error('Error', {
        description: 'Failed to delete some applications. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Bulk status update handler with rate limiting
  const handleBulkStatusUpdate = async (status: ApplicationStatus) => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(`Updating ${selectedCount} applications...`);

    try {
      await processBatch(
        selectedRows,
        async (row) => {
          await updateApplication(row.id, { status });
        },
        10, // Process 10 at a time (updates are faster than deletes)
        30, // 30ms delay between batches
      );

      toast.success('Success', {
        description: `Updated ${selectedCount} application${selectedCount > 1 ? 's' : ''}`,
      });
      onClearSelection();
    } catch (error) {
      console.error('Error updating applications:', error);
      toast.error('Error', {
        description: 'Failed to update some applications. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Bulk priority update handler with rate limiting
  const handleBulkPriorityUpdate = async (priority: 'low' | 'medium' | 'high') => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(`Updating priorities for ${selectedCount} applications...`);

    try {
      await processBatch(
        selectedRows,
        async (row) => {
          await updateApplication(row.id, { priority });
        },
        10, // Process 10 at a time
        30, // 30ms delay between batches
      );

      toast.success('Success', {
        description: `Updated ${selectedCount} application${selectedCount > 1 ? 's' : ''}`,
      });
      onClearSelection();
    } catch (error) {
      console.error('Error updating priorities:', error);
      toast.error('Error', {
        description: 'Failed to update some applications. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  // Export to CSV handler
  const handleExportToCSV = () => {
    // Prepare CSV data
    const headers = [
      'Position',
      'Company',
      'Status',
      'Priority',
      'Work Type',
      'Location',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Applied Date',
      'Target Date',
      'Updated At',
      'Notes',
      'Tags',
    ];

    const rows = selectedRows.map((app) => [
      app.position,
      app.companyName,
      app.status,
      app.priority || '',
      app.workType || '',
      app.location || '',
      app.salary?.min?.toString() || '',
      app.salary?.max?.toString() || '',
      app.salary?.currency || '',
      app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : '',
      app.targetDate ? new Date(app.targetDate).toISOString().split('T')[0] : '',
      new Date(app.updatedAt).toISOString().split('T')[0],
      app.notes || '',
      app.tags?.join('; ') || '',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `applications-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>

          {/* Bulk Status Update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing}>
                {isProcessing &&
                progressMessage.includes('Updating') &&
                !progressMessage.includes('priorities') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Update Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Change status to:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {APPLICATION_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => handleBulkStatusUpdate(status.value)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                    <span>{status.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Priority Update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing}>
                <Flag className="mr-2 h-4 w-4" />
                Update Priority
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Change priority to:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PRIORITY_LEVELS.map((priority) => (
                <DropdownMenuItem
                  key={priority.value}
                  onClick={() => handleBulkPriorityUpdate(priority.value)}
                >
                  <span className="capitalize">{priority.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export to CSV */}
          <Button variant="outline" size="sm" onClick={handleExportToCSV} disabled={isProcessing}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          {/* Bulk Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isProcessing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={isProcessing}>
            Clear
          </Button>
        </div>

        {/* Progress Indicator */}
        {isProcessing && progress > 0 && (
          <div className="px-3 pb-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progressMessage}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} application{selectedCount > 1 ? 's' : ''}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Show progress during deletion */}
          {isProcessing && progress > 0 && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deleting applications...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
