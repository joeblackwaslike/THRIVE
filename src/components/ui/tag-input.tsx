import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value = '', onChange, placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>(
    value
      ? value
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  );
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const updateTags = (newTags: string[]) => {
    setTags(newTags);
    onChange?.(newTags.join(', '));
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      updateTags([...tags, trimmedTag]);
    }
    setInputValue('');
    setHighlightedIndex(null);
  };

  const removeTag = (index: number) => {
    updateTags(tags.filter((_, i) => i !== index));
    setHighlightedIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      if (highlightedIndex !== null) {
        removeTag(highlightedIndex);
      } else {
        setHighlightedIndex(tags.length - 1);
      }
    } else {
      // Clear highlight when typing
      if (highlightedIndex !== null) {
        setHighlightedIndex(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const newTag = value.replace(',', '').trim();
      if (newTag) {
        addTag(newTag);
      }
    } else {
      setInputValue(value);
      setHighlightedIndex(null);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 bg-background',
        className,
      )}
    >
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className={cn(
            'flex items-center gap-1 px-2 py-1 transition-colors',
            highlightedIndex === index && 'ring-2 ring-primary',
          )}
        >
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${tag} tag`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder || 'Type and press comma or enter...' : ''}
        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
      />
    </div>
  );
}
