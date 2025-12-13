import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CompanyPrepNote,
  InterviewQuestion,
  PracticeSession,
  PrepAnswer,
  PrepStats,
  TechnicalChallenge,
} from '@/types/interviewPrep';

interface InterviewPrepState {
  // Questions
  questions: InterviewQuestion[];
  addQuestion: (question: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQuestion: (id: string, updates: Partial<InterviewQuestion>) => void;
  deleteQuestion: (id: string) => void;

  // Answers
  answers: PrepAnswer[];
  addAnswer: (answer: Omit<PrepAnswer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnswer: (id: string, updates: Partial<PrepAnswer>) => void;
  deleteAnswer: (id: string) => void;
  getAnswersForQuestion: (questionId: string) => PrepAnswer[];

  // Company Prep Notes
  companyNotes: CompanyPrepNote[];
  addCompanyNote: (note: Omit<CompanyPrepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompanyNote: (id: string, updates: Partial<CompanyPrepNote>) => void;
  deleteCompanyNote: (id: string) => void;
  getCompanyNote: (companyName: string) => CompanyPrepNote | undefined;

  // Technical Challenges
  challenges: TechnicalChallenge[];
  addChallenge: (challenge: Omit<TechnicalChallenge, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateChallenge: (id: string, updates: Partial<TechnicalChallenge>) => void;
  deleteChallenge: (id: string) => void;

  // Practice Sessions
  practiceSessions: PracticeSession[];
  addPracticeSession: (session: Omit<PracticeSession, 'id' | 'createdAt'>) => void;
  getSessionsForQuestion: (questionId: string) => PracticeSession[];

  // Statistics
  getStats: () => PrepStats;
}

export const useInterviewPrepStore = create<InterviewPrepState>()(
  persist(
    (set, get) => ({
      // Initial state
      questions: [],
      answers: [],
      companyNotes: [],
      challenges: [],
      practiceSessions: [],

      // Questions
      addQuestion: (question) =>
        set((state) => ({
          questions: [
            ...state.questions,
            {
              ...question,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateQuestion: (id, updates) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q,
          ),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
          answers: state.answers.filter((a) => a.questionId !== id),
          practiceSessions: state.practiceSessions.filter((s) => s.questionId !== id),
        })),

      // Answers
      addAnswer: (answer) =>
        set((state) => ({
          answers: [
            ...state.answers,
            {
              ...answer,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateAnswer: (id, updates) =>
        set((state) => ({
          answers: state.answers.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a,
          ),
        })),

      deleteAnswer: (id) =>
        set((state) => ({
          answers: state.answers.filter((a) => a.id !== id),
        })),

      getAnswersForQuestion: (questionId) => {
        return get().answers.filter((a) => a.questionId === questionId);
      },

      // Company Prep Notes
      addCompanyNote: (note) =>
        set((state) => ({
          companyNotes: [
            ...state.companyNotes,
            {
              ...note,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateCompanyNote: (id, updates) =>
        set((state) => ({
          companyNotes: state.companyNotes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n,
          ),
        })),

      deleteCompanyNote: (id) =>
        set((state) => ({
          companyNotes: state.companyNotes.filter((n) => n.id !== id),
        })),

      getCompanyNote: (companyName) => {
        return get().companyNotes.find(
          (n) => n.companyName.toLowerCase() === companyName.toLowerCase(),
        );
      },

      // Technical Challenges
      addChallenge: (challenge) =>
        set((state) => ({
          challenges: [
            ...state.challenges,
            {
              ...challenge,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateChallenge: (id, updates) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c,
          ),
        })),

      deleteChallenge: (id) =>
        set((state) => ({
          challenges: state.challenges.filter((c) => c.id !== id),
        })),

      // Practice Sessions
      addPracticeSession: (session) =>
        set((state) => ({
          practiceSessions: [
            ...state.practiceSessions,
            {
              ...session,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            },
          ],
        })),

      getSessionsForQuestion: (questionId) => {
        return get().practiceSessions.filter((s) => s.questionId === questionId);
      },

      // Statistics
      getStats: () => {
        const state = get();
        const totalQuestions = state.questions.length;
        const answeredQuestions = new Set(state.answers.map((a) => a.questionId)).size;
        const practiceSessionsCount = state.practiceSessions.length;

        const sessionsWithRating = state.practiceSessions.filter((s) => s.rating);
        const averageRating =
          sessionsWithRating.length > 0
            ? sessionsWithRating.reduce((sum, s) => sum + (s.rating || 0), 0) /
              sessionsWithRating.length
            : 0;

        const questionsByCategory = state.questions.reduce(
          (acc, q) => {
            acc[q.category] = (acc[q.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const companiesResearched = state.companyNotes.filter((n) => n.researched).length;
        const challengesCompleted = state.challenges.filter(
          (c) => c.status === 'completed' || c.status === 'submitted',
        ).length;
        const challengesPending = state.challenges.filter(
          (c) => c.status === 'not-started' || c.status === 'in-progress',
        ).length;

        return {
          totalQuestions,
          answeredQuestions,
          practiceSessionsCount,
          averageRating,
          questionsByCategory,
          companiesResearched,
          challengesCompleted,
          challengesPending,
        };
      },
    }),
    {
      name: 'interview-prep-storage',
    },
  ),
);
