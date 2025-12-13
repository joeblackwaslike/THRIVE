import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tag } from '@/types/activity';
import { PREDEFINED_TAGS } from '@/types/activity';

interface TagStore {
  tags: Tag[];
  entityTags: Record<string, string[]>; // entityId -> tagIds[]
  initialized: boolean;

  // Actions
  initializeTags: () => void;
  addTag: (tag: Omit<Tag, 'id' | 'usageCount' | 'createdAt'>) => Tag;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'usageCount'>>) => void;
  deleteTag: (id: string) => void;
  getTag: (id: string) => Tag | undefined;
  searchTags: (query: string) => Tag[];

  // Entity-Tag associations
  tagEntity: (entityId: string, tagId: string) => void;
  untagEntity: (entityId: string, tagId: string) => void;
  getEntityTags: (entityId: string) => Tag[];
  getEntitiesByTag: (tagId: string) => string[];

  // Popular tags
  getPopularTags: (limit?: number) => Tag[];
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tags: [],
      entityTags: {},
      initialized: false,

      initializeTags: () => {
        const { initialized, tags } = get();

        // Only initialize once and only if no tags exist
        if (!initialized && tags.length === 0) {
          const now = new Date();
          const predefinedTags: Tag[] = PREDEFINED_TAGS.map((tag, index) => ({
            ...tag,
            id: `tag-${index}`,
            usageCount: 0,
            createdAt: now,
          }));

          set({
            tags: predefinedTags,
            initialized: true,
          });
        } else {
          set({ initialized: true });
        }
      },

      addTag: (tag) => {
        const now = new Date();
        const newTag: Tag = {
          ...tag,
          id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          usageCount: 0,
          createdAt: now,
        };

        set((state) => ({
          tags: [...state.tags, newTag],
        }));

        return newTag;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag)),
        }));
      },

      deleteTag: (id) => {
        set((state) => {
          // Remove tag from all entities
          const newEntityTags = { ...state.entityTags };
          for (const entityId of Object.keys(newEntityTags)) {
            newEntityTags[entityId] = newEntityTags[entityId].filter((tagId) => tagId !== id);
            if (newEntityTags[entityId].length === 0) {
              delete newEntityTags[entityId];
            }
          }

          return {
            tags: state.tags.filter((tag) => tag.id !== id),
            entityTags: newEntityTags,
          };
        });
      },

      getTag: (id) => {
        return get().tags.find((tag) => tag.id === id);
      },

      searchTags: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().tags.filter(
          (tag) =>
            tag.name.toLowerCase().includes(lowerQuery) ||
            tag.description?.toLowerCase().includes(lowerQuery),
        );
      },

      tagEntity: (entityId, tagId) => {
        set((state) => {
          const currentTags = state.entityTags[entityId] || [];

          // Don't add duplicate tags
          if (currentTags.includes(tagId)) {
            return state;
          }

          return {
            entityTags: {
              ...state.entityTags,
              [entityId]: [...currentTags, tagId],
            },
            tags: state.tags.map((tag) =>
              tag.id === tagId ? { ...tag, usageCount: tag.usageCount + 1 } : tag,
            ),
          };
        });
      },

      untagEntity: (entityId, tagId) => {
        set((state) => {
          const currentTags = state.entityTags[entityId] || [];
          const newTags = currentTags.filter((id) => id !== tagId);

          const newEntityTags = { ...state.entityTags };
          if (newTags.length === 0) {
            delete newEntityTags[entityId];
          } else {
            newEntityTags[entityId] = newTags;
          }

          return {
            entityTags: newEntityTags,
            tags: state.tags.map((tag) =>
              tag.id === tagId && tag.usageCount > 0
                ? { ...tag, usageCount: tag.usageCount - 1 }
                : tag,
            ),
          };
        });
      },

      getEntityTags: (entityId) => {
        const tagIds = get().entityTags[entityId] || [];
        const { tags } = get();
        return tagIds
          .map((id) => tags.find((tag) => tag.id === id))
          .filter((tag): tag is Tag => tag !== undefined);
      },

      getEntitiesByTag: (tagId) => {
        const { entityTags } = get();
        return Object.entries(entityTags)
          .filter(([, tagIds]) => tagIds.includes(tagId))
          .map(([entityId]) => entityId);
      },

      getPopularTags: (limit = 10) => {
        return [...get().tags].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
      },
    }),
    {
      name: 'thrive-tags',
      version: 1,
    },
  ),
);
