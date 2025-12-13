import { useThrottledCallback } from '@tanstack/react-pacer';
import { ArrowRight, Clock, Search, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fuzzyMatch, scoreMatch } from '@/lib/search';
import { cn } from '@/lib/utils';
import { useSearchStore } from '@/stores/searchStore';

interface AdvancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  category?: 'applications' | 'interviews' | 'documents' | 'contacts';
  className?: string;
  showHistory?: boolean;
  showSuggestions?: boolean;
}

export function AdvancedSearch({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  suggestions = [],
  category,
  className,
  showHistory = true,
  showSuggestions = true,
}: AdvancedSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addSearch, removeSearch, getTopSearches } = useSearchStore();

  // Filter recent searches by category if specified
  const relevantHistory = useMemo(() => {
    const filtered = category
      ? recentSearches.filter((s) => s.category === category)
      : recentSearches;
    return filtered.slice(0, 5);
  }, [recentSearches, category]);

  // Get popular searches
  const popularSearches = useMemo(() => getTopSearches(3), [getTopSearches]);

  // Fuzzy match suggestions based on current input
  const matchedSuggestions = useMemo(() => {
    if (!value || !showSuggestions) return [];

    return suggestions
      .filter((s) => fuzzyMatch(s, value, 0.5))
      .map((s) => ({ text: s, score: scoreMatch(s, value) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.text);
  }, [value, suggestions, showSuggestions]);

  // Combined dropdown items
  const dropdownItems = useMemo(() => {
    const items: Array<{
      type: 'suggestion' | 'history' | 'popular';
      text: string;
      timestamp?: Date;
      resultCount?: number;
    }> = [];

    // Add suggestions first
    if (matchedSuggestions.length > 0) {
      items.push(...matchedSuggestions.map((s) => ({ type: 'suggestion' as const, text: s })));
    }

    // Add history if no current search
    if (!value && showHistory) {
      items.push(
        ...relevantHistory.map((h) => ({
          type: 'history' as const,
          text: h.query,
          timestamp: h.timestamp,
          resultCount: h.resultCount,
        })),
      );

      // Add popular searches
      if (items.length < 3) {
        items.push(
          ...popularSearches.map((p) => ({
            type: 'popular' as const,
            text: p.query,
            resultCount: p.resultCount,
          })),
        );
      }
    }

    return items;
  }, [matchedSuggestions, value, showHistory, relevantHistory, popularSearches]);

  const showDropdown = isFocused && dropdownItems.length > 0;

  // Handle item selection
  const handleSelectItem = (text: string) => {
    onChange(text);
    if (onSearch) {
      onSearch(text);
    }
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Throttled mouse enter handler (50ms for smooth but performant hover feedback)
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const throttledMouseEnter = useThrottledCallback(handleMouseEnter, { wait: 50 });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter' && value && onSearch) {
        onSearch(value);
        addSearch(value, 0, category);
        setIsFocused(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, dropdownItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (dropdownItems[selectedIndex]) {
          handleSelectItem(dropdownItems[selectedIndex].text);
        } else if (value && onSearch) {
          onSearch(value);
          addSearch(value, 0, category);
          setIsFocused(false);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Reset selected index when dropdown items change
  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow clicking on dropdown items
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
          <ScrollArea className="max-h-[300px]">
            <div className="p-2">
              {dropdownItems.map((item, index) => (
                <button
                  key={`${item.type}-${item.text}-${index}`}
                  type="button"
                  onClick={() => handleSelectItem(item.text)}
                  onMouseEnter={() => throttledMouseEnter(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
                    'hover:bg-muted/50',
                    index === selectedIndex && 'bg-muted',
                  )}
                >
                  {item.type === 'history' && (
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {item.type === 'popular' && (
                    <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {item.type === 'suggestion' && (
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.text}</div>
                    {item.resultCount !== undefined && item.resultCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {item.type === 'history' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearch(item.text);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </ScrollArea>

          {!value && relevantHistory.length > 0 && (
            <div className="border-t px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  for (const h of relevantHistory) {
                    removeSearch(h.query);
                  }
                  setIsFocused(false);
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Clear search history
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
