import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchSuggestion {
  query: string;
  timestamp: Date;
  resultCount: number;
  category?: 'applications' | 'interviews' | 'documents' | 'contacts';
}

interface SearchState {
  recentSearches: SearchSuggestion[];
  popularSearches: SearchSuggestion[];

  // Actions
  addSearch: (query: string, resultCount: number, category?: SearchSuggestion['category']) => void;
  clearRecentSearches: () => void;
  removeSearch: (query: string) => void;
  getTopSearches: (limit?: number) => SearchSuggestion[];
}

const MAX_RECENT_SEARCHES = 20;

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      popularSearches: [],

      addSearch: (query, resultCount, category) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        set((state) => {
          // Remove duplicate if exists
          const filtered = state.recentSearches.filter(
            (s) => s.query.toLowerCase() !== trimmedQuery.toLowerCase(),
          );

          // Add to front
          const newSearch: SearchSuggestion = {
            query: trimmedQuery,
            timestamp: new Date(),
            resultCount,
            category,
          };

          const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);

          return { recentSearches: updated };
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      removeSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s.query !== query),
        }));
      },

      getTopSearches: (limit = 5) => {
        const { recentSearches } = get();

        // Count frequency of searches
        const frequency = new Map<string, number>();
        for (const search of recentSearches) {
          const count = frequency.get(search.query) || 0;
          frequency.set(search.query, count + 1);
        }

        // Get unique searches with their frequency
        const uniqueSearches = recentSearches.filter(
          (search, index, self) => index === self.findIndex((s) => s.query === search.query),
        );

        // Sort by frequency
        return uniqueSearches
          .sort((a, b) => {
            const freqA = frequency.get(a.query) || 0;
            const freqB = frequency.get(b.query) || 0;
            return freqB - freqA;
          })
          .slice(0, limit);
      },
    }),
    {
      name: 'thrive-search-history',
    },
  ),
);
