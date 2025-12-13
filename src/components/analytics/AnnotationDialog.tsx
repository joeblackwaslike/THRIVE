import { format } from 'date-fns';
import { Calendar, Plus, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
  ANNOTATION_COLORS,
  type AnnotationType,
  useAnnotationsStore,
} from '@/stores/annotationsStore';

interface AnnotationDialogProps {
  defaultDate?: Date;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ANNOTATION_TYPES: {
  value: AnnotationType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'milestone',
    label: 'Milestone',
    description: 'Important achievement or goal',
    icon: '🎯',
  },
  { value: 'note', label: 'Note', description: 'General observation or comment', icon: '📝' },
  {
    value: 'reminder',
    label: 'Reminder',
    description: 'Something to remember or follow up',
    icon: '⏰',
  },
  { value: 'event', label: 'Event', description: 'Significant occurrence or activity', icon: '🎉' },
];

export function AnnotationDialog({
  defaultDate,
  trigger,
  open,
  onOpenChange,
}: AnnotationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [date, setDate] = useState(
    defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AnnotationType>('note');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const { addAnnotation } = useAnnotationsStore();

  // Use controlled state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  // Sync date with defaultDate when it changes
  useEffect(() => {
    if (defaultDate) {
      setDate(format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [defaultDate]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    addAnnotation({
      date: new Date(date),
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      tags: tags.length > 0 ? tags : undefined,
      color: ANNOTATION_COLORS[type],
    });

    toast.success(`${ANNOTATION_TYPES.find((t) => t.value === type)?.icon} Annotation added!`);

    // Reset form
    setTitle('');
    setDescription('');
    setType('note');
    setTags([]);
    setTagInput('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Annotation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Annotation</DialogTitle>
          <DialogDescription>
            Mark important dates, events, or add notes to your analytics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="annotation-date">Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="annotation-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="annotation-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as AnnotationType)}>
              <SelectTrigger id="annotation-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANNOTATION_TYPES.map((annotationType) => (
                  <SelectItem key={annotationType.value} value={annotationType.value}>
                    <div className="flex items-center gap-2">
                      <span>{annotationType.icon}</span>
                      <div>
                        <div className="font-medium">{annotationType.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {annotationType.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="annotation-title">Title</Label>
            <Input
              id="annotation-title"
              placeholder="e.g., Reached 50 applications!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="annotation-description">Description (optional)</Label>
            <Textarea
              id="annotation-description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="annotation-tags">Tags (optional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annotation-tags"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Annotation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
