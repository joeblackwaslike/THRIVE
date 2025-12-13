import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Pencil, Pin, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useActivityStore } from '@/stores/activityStore';
import { useNoteStore } from '@/stores/noteStore';
import type { Note } from '@/types/activity';

interface NotesListProps {
  entityId: string;
  entityType: Note['entityType'];
  className?: string;
}

const NOTE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'research', label: 'Research' },
  { value: 'interview', label: 'Interview' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500',
  research: 'bg-blue-500',
  interview: 'bg-purple-500',
  'follow-up': 'bg-orange-500',
  technical: 'bg-green-500',
  cultural: 'bg-pink-500',
};

export function NotesList({ entityId, entityType, className }: NotesListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<Note['category']>('general');

  const notes = useNoteStore((state) => state.getNotesByEntity(entityId, entityType));
  const addNote = useNoteStore((state) => state.addNote);
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const togglePinNote = useNoteStore((state) => state.togglePinNote);
  const addActivity = useActivityStore((state) => state.addActivity);

  // Sort: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const note = addNote({
        content: newNoteContent.trim(),
        entityId,
        entityType,
        category: newNoteCategory,
      });

      addActivity({
        type: 'note_added',
        entityId,
        entityType,
        description: `Added note: ${note.content.slice(0, 50)}${note.content.length > 50 ? '...' : ''}`,
      });

      setNewNoteContent('');
      setNewNoteCategory('general');
      setIsAdding(false);
    }
  };

  const handleUpdateNote = (id: string, content: string) => {
    if (content.trim()) {
      updateNote(id, { content: content.trim() });
      setEditingId(null);
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="h-4 w-4" />
          Notes ({notes.length})
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
          <Select
            value={newNoteCategory}
            onValueChange={(value) => setNewNoteCategory(value as Note['category'])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note here..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent('');
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
              Save Note
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 && !isAdding && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <StickyNote className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No notes yet. Add your first note!</p>
        </div>
      )}

      {sortedNotes.map((note) => (
        <div
          key={note.id}
          className={cn(
            'rounded-lg border p-3 space-y-2',
            note.isPinned &&
              'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {note.isPinned && <Pin className="h-3 w-3 text-yellow-600" />}
              {note.category && (
                <Badge
                  variant="secondary"
                  className={cn('text-xs', CATEGORY_COLORS[note.category])}
                >
                  {NOTE_CATEGORIES.find((c) => c.value === note.category)?.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => togglePinNote(note.id)}>
                  <Pin className="mr-2 h-4 w-4" />
                  {note.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingId(note.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {editingId === note.id ? (
            <div className="space-y-2">
              <Textarea
                defaultValue={note.content}
                onBlur={(e) => handleUpdateNote(note.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleUpdateNote(note.id, e.currentTarget.value);
                  }
                }}
                className="min-h-[100px]"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          )}
        </div>
      ))}
    </div>
  );
}
