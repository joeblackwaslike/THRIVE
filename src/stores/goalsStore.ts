import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface JobSearchGoal {
  id: string;
  type: 'applications' | 'interviews' | 'offers' | 'responseRate';
  period: 'weekly' | 'monthly';
  target: number;
  startDate: Date;
  endDate?: Date;
  active: boolean;
  createdAt: Date;
}

interface GoalsState {
  goals: JobSearchGoal[];
  addGoal: (goal: Omit<JobSearchGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<JobSearchGoal>) => void;
  deleteGoal: (id: string) => void;
  getActiveGoals: () => JobSearchGoal[];
  getGoalsByType: (type: JobSearchGoal['type']) => JobSearchGoal[];
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const newGoal: JobSearchGoal = {
          ...goal,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== id),
        }));
      },

      getActiveGoals: () => {
        return get().goals.filter((goal) => goal.active);
      },

      getGoalsByType: (type) => {
        return get().goals.filter((goal) => goal.type === type && goal.active);
      },
    }),
    {
      name: 'job-search-goals',
    },
  ),
);
