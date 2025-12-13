import { Plus, Save, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type QueryType,
  useCustomWidgetsStore,
  type WidgetFilter,
} from '@/stores/customWidgetsStore';
import { WidgetFilterRow } from './WidgetFilterRow';

export function CustomWidgetBuilder() {
  const { addWidget } = useCustomWidgetsStore();
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('count');
  const [dataSource, setDataSource] = useState<'applications' | 'interviews'>('applications');
  const [displayType, setDisplayType] = useState<'number' | 'list' | 'bar-chart'>('number');
  const [colorScheme, setColorScheme] = useState<'primary' | 'success' | 'warning' | 'danger'>(
    'primary',
  );
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [filters, setFilters] = useState<WidgetFilter[]>([]);

  const handleSave = () => {
    if (!title.trim()) return;

    addWidget({
      title,
      description,
      queryType,
      dataSource,
      filters,
      displayType,
      colorScheme,
      size,
      visible: true,
      order: 0,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setQueryType('count');
    setDataSource('applications');
    setDisplayType('number');
    setColorScheme('primary');
    setSize('medium');
    setFilters([]);
    setOpen(false);
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        field: 'status',
        operator: 'equals',
        value: '',
      },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<WidgetFilter>) => {
    setFilters(filters.map((filter, i) => (i === index ? { ...filter, ...updates } : filter)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <AnimatedButton variant="default" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create Custom Widget
        </AnimatedButton>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create Custom Widget
          </DialogTitle>
          <DialogDescription>
            Build a personalized widget to track exactly what matters to you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Widget Title *</Label>
              <Input
                id="title"
                placeholder="e.g., High Priority Applications"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this widget show?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Data Source & Query Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select
                value={dataSource}
                onValueChange={(value: 'applications' | 'interviews') => setDataSource(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Query Type</Label>
              <Select value={queryType} onValueChange={(value: QueryType) => setQueryType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count Items</SelectItem>
                  <SelectItem value="list">Show List</SelectItem>
                  <SelectItem value="stat">Show Statistic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Options */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Display Type</Label>
              <Select
                value={displayType}
                onValueChange={(value) => setDisplayType(value as typeof displayType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="bar-chart">Bar Chart</SelectItem>
                  <SelectItem value="pie-chart">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={colorScheme}
                onValueChange={(value) => setColorScheme(value as typeof colorScheme)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Blue</SelectItem>
                  <SelectItem value="success">Green</SelectItem>
                  <SelectItem value="warning">Orange</SelectItem>
                  <SelectItem value="danger">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={size} onValueChange={(value) => setSize(value as typeof size)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large (2 cols)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Filters (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                <Plus className="h-3 w-3 mr-1" />
                Add Filter
              </Button>
            </div>

            {filters.map((filter, index) => (
              <WidgetFilterRow
                key={index}
                filter={filter}
                onUpdate={(updates) => updateFilter(index, updates)}
                onRemove={() => removeFilter(index)}
              />
            ))}

            {filters.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No filters - will show all {dataSource}
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{title || 'Widget Title'}</h3>
                <Badge variant="secondary">{queryType}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {description || 'Widget description will appear here'}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Badge>{dataSource}</Badge>
                <Badge variant="outline">{displayType}</Badge>
                {filters.length > 0 && <Badge>{filters.length} filter(s)</Badge>}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Create Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
