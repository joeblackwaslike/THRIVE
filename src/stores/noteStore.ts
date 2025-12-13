import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note } from '@/types/activity';

interface NoteStore {
  notes: Note[];

  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  getNotesByEntity: (entityId: string, entityType?: Note['entityType']) => Note[];
  togglePinNote: (id: string) => void;
  searchNotes: (query: string) => Note[];
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (note) => {
        const now = new Date();
        const newNote: Note = {
          ...note,
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          notes: [newNote, ...state.notes],
        }));

        return newNote;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...updates,
                  updatedAt: new Date(),
                }
              : note,
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      getNote: (id) => {
        return get().notes.find((note) => note.id === id);
      },

      getNotesByEntity: (entityId, entityType) => {
        return get().notes.filter(
          (note) =>
            note.entityId === entityId &&
            (entityType === undefined || note.entityType === entityType),
        );
      },

      togglePinNote: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  isPinned: !note.isPinned,
                  updatedAt: new Date(),
                }
              : note,
          ),
        }));
      },

      searchNotes: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().notes.filter((note) => note.content.toLowerCase().includes(lowerQuery));
      },
    }),
    {
      name: 'thrive-notes',
      version: 1,
    },
  ),
);
