import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResolvedTemplate, Template, TemplateCategory } from '@/types/template';
import { DEFAULT_TEMPLATES } from '@/types/template';

interface TemplateStore {
  templates: Template[];
  initialized: boolean;

  // Actions
  initializeTemplates: () => void;
  addTemplate: (
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
  ) => Template;
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id' | 'createdAt'>>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getTemplatesByCategory: (category: TemplateCategory) => Template[];
  searchTemplates: (query: string) => Template[];
  incrementUsage: (id: string) => void;
  resolveTemplate: (id: string, variables: Record<string, string>) => ResolvedTemplate | null;
  duplicateTemplate: (id: string) => Template | null;
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      initialized: false,

      initializeTemplates: () => {
        const { initialized, templates } = get();

        // Only initialize once and only if no templates exist
        if (!initialized && templates.length === 0) {
          const now = new Date();
          const defaultTemplates: Template[] = DEFAULT_TEMPLATES.map((template, index) => ({
            ...template,
            id: `default-${index}`,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
          }));

          set({
            templates: defaultTemplates,
            initialized: true,
          });
        } else {
          set({ initialized: true });
        }
      },

      addTemplate: (template) => {
        const now = new Date();
        const newTemplate: Template = {
          ...template,
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  ...updates,
                  updatedAt: new Date(),
                }
              : template,
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }));
      },

      getTemplate: (id) => {
        return get().templates.find((template) => template.id === id);
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((template) => template.category === category);
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().templates.filter(
          (template) =>
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description?.toLowerCase().includes(lowerQuery) ||
            template.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );
      },

      incrementUsage: (id) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  usageCount: template.usageCount + 1,
                  updatedAt: new Date(),
                }
              : template,
          ),
        }));
      },

      resolveTemplate: (id, variables) => {
        const template = get().getTemplate(id);
        if (!template) return null;

        let resolvedContent = template.content;

        // Replace all variables in the template
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          resolvedContent = resolvedContent.replace(regex, value);
        }

        // Check for any unresolved required variables
        const unresolvedRequired = template.variables
          .filter((v) => v.required)
          .filter((v) => !variables[v.key] || variables[v.key].trim() === '')
          .map((v) => v.key);

        if (unresolvedRequired.length > 0) {
          console.warn('Unresolved required variables:', unresolvedRequired);
        }

        // Increment usage count
        get().incrementUsage(id);

        return {
          content: resolvedContent,
          variables,
        };
      },

      duplicateTemplate: (id) => {
        const template = get().getTemplate(id);
        if (!template) return null;

        const duplicated = get().addTemplate({
          ...template,
          name: `${template.name} (Copy)`,
          isDefault: false,
        });

        return duplicated;
      },
    }),
    {
      name: 'thrive-templates',
      version: 1,
    },
  ),
);
