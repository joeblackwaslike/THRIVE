import { Check, Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useApplicationsStore, useDocumentsStore } from '@/stores';
import type { Document } from '@/types';

interface LinkApplicationDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkApplicationDialog({
  document,
  open,
  onOpenChange,
}: LinkApplicationDialogProps) {
  const { applications } = useApplicationsStore();
  const { linkDocumentToApplications, unlinkDocumentFromApplication } = useDocumentsStore();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initializedDocId, setInitializedDocId] = useState<string | null>(null);

  // Initialize selected applications when dialog opens or document changes
  // Only reset if it's a different document (not just a reference change)
  useEffect(() => {
    if (document && open && document.id !== initializedDocId) {
      setSelectedAppIds(document.usedInApplicationIds || []);
      setSearchQuery('');
      setInitializedDocId(document.id);
    } else if (!open) {
      // Reset when dialog closes
      setInitializedDocId(null);
    }
  }, [document, open, initializedDocId]);

  // Filter applications by search query
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.position.toLowerCase().includes(query) ||
      app.companyName.toLowerCase().includes(query) ||
      app.location?.toLowerCase().includes(query)
    );
  });

  const handleToggleApplication = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId],
    );
  };

  const handleSave = async () => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      const currentlyLinkedAppIds = document.usedInApplicationIds || [];

      // Find applications to unlink (were linked before, not selected now)
      const appsToUnlink = currentlyLinkedAppIds.filter((appId) => !selectedAppIds.includes(appId));

      // Find applications to link (selected now, weren't linked before)
      const appsToLink = selectedAppIds.filter((appId) => !currentlyLinkedAppIds.includes(appId));

      // Unlink removed applications
      for (const appId of appsToUnlink) {
        await unlinkDocumentFromApplication(document.id, appId);
      }

      // Link new applications
      if (appsToLink.length > 0) {
        await linkDocumentToApplications(document.id, appsToLink);
      }

      toast.success(
        selectedAppIds.length === 0
          ? 'Document unlinked from all applications'
          : `Document linked to ${selectedAppIds.length} application${selectedAppIds.length > 1 ? 's' : ''}`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update document links');
      console.error('Error linking document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      applied: 'outline',
      'phone-screen': 'secondary',
      interview: 'default',
      offer: 'default',
      rejected: 'destructive',
      accepted: 'default',
    };
    return variants[status] || 'secondary';
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 animate-scaleIn">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Link to Applications
          </DialogTitle>
          <DialogDescription>
            Select which applications use <span className="font-medium">{document.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-2">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />

          {/* Selected count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedAppIds.length} application{selectedAppIds.length !== 1 ? 's' : ''} selected
            </span>
            {selectedAppIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAppIds([])}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Applications list */}
          <div className="border rounded-md max-h-[300px] overflow-y-auto scrollbar-hide">
            <div className="p-2 space-y-1">
              {filteredApplications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No applications found' : 'No applications yet'}
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const isSelected = selectedAppIds.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleToggleApplication(app.id)}
                      className={`w-full text-left p-3 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-accent border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Checkbox checked={isSelected} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{app.position}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {app.companyName}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getStatusBadge(app.status)} className="text-xs">
                              {app.status.replace('-', ' ')}
                            </Badge>
                            {app.location && (
                              <span className="text-xs text-muted-foreground">{app.location}</span>
                            )}
                            {app.appliedDate && (
                              <span className="text-xs text-muted-foreground">
                                Applied {new Date(app.appliedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
