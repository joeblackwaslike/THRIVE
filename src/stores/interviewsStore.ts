import { gql } from '@apollo/client';
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql';
import type { Interview } from '@/types';

// GraphQL queries
const GET_INTERVIEWS = gql`
  query GetInterviews {
    interviews {
      id
      applicationId
      round
      type
      status
      scheduledAt
      duration
      location
      meetingUrl
      interviewers {
        name
        title
        linkedin
        email
        notes
      }
      preparationNotes
      questionsAsked
      questionsToAsk
      feedback
      followUpSent
      followUpDate
      result
      createdAt
      updatedAt
    }
  }
`;

const GET_INTERVIEWS_BY_APPLICATION = gql`
  query GetInterviewsByApplication($applicationId: ID!) {
    interviewsByApplication(applicationId: $applicationId) {
      id
      applicationId
      round
      type
      status
      scheduledAt
      duration
      location
      meetingUrl
      interviewers {
        name
        title
        linkedin
        email
        notes
      }
      preparationNotes
      questionsAsked
      questionsToAsk
      feedback
      followUpSent
      followUpDate
      result
      createdAt
      updatedAt
    }
  }
`;

const GET_INTERVIEW = gql`
  query GetInterview($id: ID!) {
    interview(id: $id) {
      id
      applicationId
      round
      type
      status
      scheduledAt
      duration
      location
      meetingUrl
      interviewers {
        name
        title
        linkedin
        email
        notes
      }
      preparationNotes
      questionsAsked
      questionsToAsk
      feedback
      followUpSent
      followUpDate
      result
      createdAt
      updatedAt
    }
  }
`;

const CREATE_INTERVIEW = gql`
  mutation CreateInterview($input: InterviewInput!) {
    createInterview(input: $input) {
      id
      applicationId
      round
      type
      status
      scheduledAt
      duration
      location
      meetingUrl
      interviewers {
        name
        title
        linkedin
        email
        notes
      }
      preparationNotes
      questionsAsked
      questionsToAsk
      feedback
      followUpSent
      followUpDate
      result
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_INTERVIEW = gql`
  mutation UpdateInterview($id: ID!, $input: InterviewUpdateInput!) {
    updateInterview(id: $id, input: $input) {
      id
      applicationId
      round
      type
      status
      scheduledAt
      duration
      location
      meetingUrl
      interviewers {
        name
        title
        linkedin
        email
        notes
      }
      preparationNotes
      questionsAsked
      questionsToAsk
      feedback
      followUpSent
      followUpDate
      result
      createdAt
      updatedAt
    }
  }
`;

const DELETE_INTERVIEW = gql`
  mutation DeleteInterview($id: ID!) {
    deleteInterview(id: $id)
  }
`;

interface InterviewsState {
  interviews: Interview[];
  loading: boolean;
  error: string | null;
  filters: {
    searchQuery?: string;
    status?: ('scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show')[];
    type?: (
      | 'recruiter-screen'
      | 'phone-screen'
      | 'hiring-manager-chat'
      | 'video'
      | 'technical-assessment'
      | 'on-site'
      | 'technical-interview'
      | 'behavioral-interview'
      | 'leadership-interview'
      | 'panel'
      | 'final'
      | 'other'
    )[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
  };
  setFilters: (filters: Partial<InterviewsState['filters']>) => void;
  fetchInterviews: () => Promise<void>;
  fetchInterviewsByApplication: (applicationId: string) => Promise<Interview[]>;
  fetchInterview: (id: string) => Promise<Interview | null>;
  createInterview: (
    interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Interview>;
  updateInterview: (id: string, interview: Partial<Interview>) => Promise<Interview>;
  deleteInterview: (id: string) => Promise<void>;
  getUpcomingInterviews: () => Interview[];
  getPastInterviews: () => Interview[];
  addInterview: (
    interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Interview>;
  isLoading: boolean;
}

export const useInterviewsStore = create<InterviewsState>((set, get) => ({
  interviews: [],
  loading: false,
  error: null,
  filters: {},
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  fetchInterviews: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.query({
        query: GET_INTERVIEWS,
      });
      set({ interviews: (data as any).interviews || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  fetchInterviewsByApplication: async (applicationId: string) => {
    const { data } = await graphqlClient.query({
      query: GET_INTERVIEWS_BY_APPLICATION,
      variables: { applicationId },
    });
    return (data as any).interviewsByApplication || [];
  },

  fetchInterview: async (id: string) => {
    const { data } = await graphqlClient.query({
      query: GET_INTERVIEW,
      variables: { id },
    });
    return (data as any).interview;
  },

  createInterview: async (interview: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.mutate({
        mutation: CREATE_INTERVIEW,
        variables: { input: interview },
      });

      const newInterview = (data as any).createInterview;
      set((state) => ({
        interviews: [...state.interviews, newInterview],
        loading: false,
      }));

      return newInterview;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateInterview: async (id: string, interview: Partial<Interview>) => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.mutate({
        mutation: UPDATE_INTERVIEW,
        variables: { id, input: interview },
      });

      const updatedInterview = (data as any).updateInterview;
      set((state) => ({
        interviews: state.interviews.map((i) => (i.id === id ? updatedInterview : i)),
        loading: false,
      }));

      return updatedInterview;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteInterview: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await graphqlClient.mutate({
        mutation: DELETE_INTERVIEW,
        variables: { id },
      });

      set((state) => ({
        interviews: state.interviews.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getUpcomingInterviews: () => {
    const now = new Date();
    return get()
      .interviews.filter((interview) => {
        if (!interview.scheduledAt) return false;
        return new Date(interview.scheduledAt) > now;
      })
      .sort((a, b) => {
        if (!a.scheduledAt || !b.scheduledAt) return 0;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
  },

  getPastInterviews: () => {
    const now = new Date();
    return get()
      .interviews.filter((interview) => {
        if (!interview.scheduledAt) return false;
        return new Date(interview.scheduledAt) <= now;
      })
      .sort((a, b) => {
        if (!a.scheduledAt || !b.scheduledAt) return 0;
        return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      });
  },

  addInterview: async (interview) => {
    const { data } = await graphqlClient.mutate({
      mutation: CREATE_INTERVIEW,
      variables: { input: interview },
    });
    const newInterview = (data as any)?.createInterview;
    if (newInterview) {
      set((state) => ({
        interviews: [...state.interviews, newInterview],
        loading: false,
      }));
    }
    return newInterview;
  },

  isLoading: false,
}));
