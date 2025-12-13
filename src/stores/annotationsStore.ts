import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AnnotationType = 'milestone' | 'note' | 'reminder' | 'event';

export interface Annotation {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: AnnotationType;
  color?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ANNOTATION_COLORS: Record<AnnotationType, string> = {
  milestone: '#10b981', // green
  note: '#3b82f6', // blue
  reminder: '#f59e0b', // amber
  event: '#8b5cf6', // purple
};

interface AnnotationsState {
  annotations: Annotation[];

  // CRUD operations
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<Omit<Annotation, 'id' | 'createdAt'>>) => void;
  deleteAnnotation: (id: string) => void;

  // Queries
  getAnnotationsForDate: (date: Date) => Annotation[];
  getAnnotationsInRange: (start: Date, end: Date) => Annotation[];
  getAnnotationsByType: (type: AnnotationType) => Annotation[];
  getAnnotationsByTag: (tag: string) => Annotation[];
}

export const useAnnotationsStore = create<AnnotationsState>()(
  persist(
    (set, get) => ({
      annotations: [],

      addAnnotation: (annotation) => {
        const newAnnotation: Annotation = {
          ...annotation,
          id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          color: annotation.color || ANNOTATION_COLORS[annotation.type],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          annotations: [...state.annotations, newAnnotation],
        }));
      },

      updateAnnotation: (id, updates) => {
        set((state) => ({
          annotations: state.annotations.map((annotation) =>
            annotation.id === id
              ? { ...annotation, ...updates, updatedAt: new Date() }
              : annotation,
          ),
        }));
      },

      deleteAnnotation: (id) => {
        set((state) => ({
          annotations: state.annotations.filter((annotation) => annotation.id !== id),
        }));
      },

      getAnnotationsForDate: (date) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return get().annotations.filter((annotation) => {
          const annotationDate = new Date(annotation.date);
          annotationDate.setHours(0, 0, 0, 0);
          return annotationDate.getTime() === targetDate.getTime();
        });
      },

      getAnnotationsInRange: (start, end) => {
        const startTime = new Date(start).setHours(0, 0, 0, 0);
        const endTime = new Date(end).setHours(23, 59, 59, 999);

        return get().annotations.filter((annotation) => {
          const annotationTime = new Date(annotation.date).getTime();
          return annotationTime >= startTime && annotationTime <= endTime;
        });
      },

      getAnnotationsByType: (type) => {
        return get().annotations.filter((annotation) => annotation.type === type);
      },

      getAnnotationsByTag: (tag) => {
        return get().annotations.filter((annotation) => annotation.tags?.includes(tag));
      },
    }),
    {
      name: 'annotations-storage',
    },
  ),
);

export { ANNOTATION_COLORS };
