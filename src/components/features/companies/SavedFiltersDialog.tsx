import { Calendar, Filter, Save, Search, Trash2 } from 'lucide-react';
import { type ReactElement, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/useConfirm';
import { COMPANY_STATUSES, PRIORITY_LEVELS, REMOTE_POLICIES } from '@/lib/constants';

export interface CompanySavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: {
    status?: string[];
    remotePolicy?: string[];
    researched?: boolean;
    priority?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'thrive-saved-company-filters';

interface SavedFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: {
    status?: string[];
    remotePolicy?: string[];
    researched?: boolean;
  };
  onApplyFilter: (filters: CompanySavedFilter['filters']) => void;
}

export function SavedFiltersDialog({
  open,
  onOpenChange,
  currentFilters,
  onApplyFilter,
}: SavedFiltersDialogProps) {
  const { confirm } = useConfirm();
  const [savedFilters, setSavedFilters] = useState<CompanySavedFilter[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((filter: CompanySavedFilter) => ({
          ...filter,
          createdAt: new Date(filter.createdAt),
          updatedAt: new Date(filter.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    return [];
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const persistFilters = (filters: CompanySavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const handleSaveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }

    const newFilter: CompanySavedFilter = {
      id: crypto.randomUUID(),
      name: filterName.trim(),
      description: filterDescription.trim() || undefined,
      filters: currentFilters,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [...savedFilters, newFilter];
    persistFilters(updated);
    toast.success(`Filter "${filterName}" saved`);

    setFilterName('');
    setFilterDescription('');
    setShowSaveDialog(false);
  };

  const handleDeleteFilter = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Filter',
      description: `Delete filter "${name}"?`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      const updated = savedFilters.filter((f) => f.id !== id);
      persistFilters(updated);
      toast.success(`Filter "${name}" deleted`);
    }
  };

  const handleApplyFilter = (filter: CompanySavedFilter) => {
    onApplyFilter(filter.filters);
    toast.success(`Applied filter "${filter.name}"`);
    onOpenChange(false);
  };

  const getFilterSummary = (filters: CompanySavedFilter['filters']) => {
    const parts: string[] = [];

    if (filters.status?.length) {
      parts.push(`${filters.status.length} status`);
    }
    if (filters.remotePolicy?.length) {
      parts.push(`${filters.remotePolicy.length} remote`);
    }
    if (filters.priority?.length) {
      parts.push(`${filters.priority.length} priority`);
    }
    if (filters.researched !== undefined) {
      parts.push(filters.researched ? 'researched' : 'not researched');
    }

    return parts.join(', ') || 'No filters';
  };

  const getFilterBadges = (filters: CompanySavedFilter['filters']) => {
    const badges: ReactElement[] = [];

    if (filters.status?.length) {
      filters.status.forEach((status) => {
        const config = COMPANY_STATUSES.find((s) => s.value === status);
        if (config) {
          badges.push(
            <Badge key={`status-${status}`} variant="outline" className="text-xs">
              {config.label}
            </Badge>,
          );
        }
      });
    }

    if (filters.remotePolicy?.length) {
      filters.remotePolicy.forEach((policy) => {
        const config = REMOTE_POLICIES.find((p) => p.value === policy);
        if (config) {
          badges.push(
            <Badge key={`remote-${policy}`} variant="outline" className="text-xs">
              {config.label}
            </Badge>,
          );
        }
      });
    }

    if (filters.priority?.length) {
      filters.priority.forEach((priority) => {
        const config = PRIORITY_LEVELS.find((p) => p.value === priority);
        if (config) {
          badges.push(
            <Badge key={`priority-${priority}`} variant="outline" className="text-xs">
              {config.label}
            </Badge>,
          );
        }
      });
    }

    if (filters.researched !== undefined) {
      badges.push(
        <Badge key="researched" variant="secondary" className="text-xs">
          {filters.researched ? 'Researched' : 'Not Researched'}
        </Badge>,
      );
    }

    return badges;
  };

  const filteredSavedFilters = searchQuery
    ? savedFilters.filter(
        (filter) =>
          filter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filter.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : savedFilters;

  const hasActiveFilters =
    (currentFilters.status?.length ?? 0) > 0 ||
    (currentFilters.remotePolicy?.length ?? 0) > 0 ||
    currentFilters.researched !== undefined;

  return (
    <>
      <Dialog open={open && !showSaveDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Saved Filters
            </DialogTitle>
            <DialogDescription>
              Save and manage your frequently used filter combinations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Save Current Filter Button */}
            {hasActiveFilters && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">Current Filters</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {getFilterSummary(currentFilters)}
                    </div>
                    <div className="flex flex-wrap gap-1">{getFilterBadges(currentFilters)}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search saved filters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Saved Filters List */}
            <ScrollArea className="h-[400px]">
              {filteredSavedFilters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Filter className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'No filters found' : 'No saved filters yet'}
                  </p>
                  {!searchQuery && hasActiveFilters && (
                    <p className="text-xs mt-1">Click "Save" above to save your current filters</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredSavedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium">{filter.name}</h3>
                          {filter.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {filter.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {filter.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyFilter(filter)}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFilter(filter.id, filter.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">{getFilterBadges(filter.filters)}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Filters</DialogTitle>
            <DialogDescription>
              Give your filter combination a name for easy access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name *</Label>
              <Input
                id="filter-name"
                placeholder="e.g., High Priority Remote Jobs"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-description">Description (Optional)</Label>
              <Textarea
                id="filter-description"
                placeholder="Add a description to remember what this filter is for..."
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="text-sm font-medium mb-2">Filter Preview</div>
              <div className="flex flex-wrap gap-1">{getFilterBadges(currentFilters)}</div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentFilter}>
              <Save className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
