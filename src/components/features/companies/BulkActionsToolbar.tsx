import { CheckCircle2, Flag, Loader2, Tag, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMPANY_STATUSES, PRIORITY_LEVELS } from '@/lib/constants';
import { useCompaniesStore } from '@/stores/companiesStore';
import type { Company } from '@/types';

interface BulkActionsToolbarProps {
  selectedCompanies: Company[];
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCompanies,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const { updateCompany, deleteCompany } = useCompaniesStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateField, setUpdateField] = useState<'status' | 'priority' | 'researched'>('status');
  const [newValue, setNewValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedCount = selectedCompanies.length;

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

      await Promise.all(batch.map(processor));

      completed += batch.length;
      setProgress((completed / total) * 100);

      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };

  // Bulk delete with rate limiting
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      await processBatch(
        selectedCompanies,
        async (company) => await deleteCompany(company.id),
        5,
        50,
      );

      toast.success(`Deleted ${selectedCount} ${selectedCount === 1 ? 'company' : 'companies'}`);
      setDeleteDialogOpen(false);
      onClearSelection();
    } catch (error) {
      console.error('Error deleting companies:', error);
      toast.error('Failed to delete some companies');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Bulk update with rate limiting
  const handleBulkUpdate = async () => {
    if (!newValue && updateField !== 'researched') {
      toast.error('Please select a value');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      await processBatch(
        selectedCompanies,
        async (company) => {
          const updates: Partial<Company> = {};

          if (updateField === 'status') {
            updates.status = newValue as Company['status'];
          } else if (updateField === 'priority') {
            updates.priority = newValue as Company['priority'];
          } else if (updateField === 'researched') {
            updates.researched = true;
          }

          await updateCompany(company.id, updates);
        },
        10,
        30,
      );

      const fieldLabel =
        updateField === 'researched' ? 'marked as researched' : `${updateField} updated`;
      toast.success(
        `${selectedCount} ${selectedCount === 1 ? 'company' : 'companies'} ${fieldLabel}`,
      );
      setUpdateDialogOpen(false);
      setNewValue('');
      onClearSelection();
    } catch (error) {
      console.error('Error updating companies:', error);
      toast.error('Failed to update some companies');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const openUpdateDialog = (field: 'status' | 'priority' | 'researched') => {
    setUpdateField(field);
    setNewValue('');
    setUpdateDialogOpen(true);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 border-b">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateDialog('status')}
            disabled={isProcessing}
          >
            <Tag className="h-4 w-4 mr-2" />
            Update Status
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateDialog('priority')}
            disabled={isProcessing}
          >
            <Flag className="h-4 w-4 mr-2" />
            Update Priority
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openUpdateDialog('researched')}
            disabled={isProcessing}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark Researched
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? 'Company' : 'Companies'}?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              {selectedCount === 1 ? 'this company' : 'these companies'}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {!isProcessing && selectedCount <= 5 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Companies to delete:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {selectedCompanies.map((company) => (
                  <li key={company.id}>{company.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress indicator */}
          {isProcessing && progress > 0 && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deleting companies...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedCount === 1 ? 'Company' : 'Companies'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {selectedCount} {selectedCount === 1 ? 'Company' : 'Companies'}
            </DialogTitle>
            <DialogDescription>
              {updateField === 'researched'
                ? `Mark ${selectedCount === 1 ? 'this company' : 'these companies'} as researched?`
                : `Select a new ${updateField} for ${selectedCount === 1 ? 'this company' : 'these companies'}`}
            </DialogDescription>
          </DialogHeader>

          {updateField !== 'researched' && (
            <div className="space-y-4">
              {updateField === 'status' && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Status</div>
                  <Select value={newValue} onValueChange={setNewValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {updateField === 'priority' && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Priority</div>
                  <Select value={newValue} onValueChange={setNewValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          {isProcessing && progress > 0 && (
            <div className="space-y-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updating companies...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${selectedCount === 1 ? 'Company' : 'Companies'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
