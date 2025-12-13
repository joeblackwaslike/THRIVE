import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { graphqlClient } from '../lib/graphql';
import {
  CREATE_APPLICATION,
  DELETE_APPLICATION,
  GET_APPLICATION_BY_ID,
  GET_APPLICATIONS,
  UPDATE_APPLICATION,
} from '../lib/graphql/queries';
import type { Application, ApplicationFilters } from '../types';

interface ApplicationsState {
  applications: Application[];
  loading: boolean;
  error: string | null;
  filters: ApplicationFilters;

  // Actions
  fetchApplications: () => Promise<void>;
  fetchApplication: (id: string) => Promise<Application | null>;
  createApplication: (
    application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<Application | null>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<Application | null>;
  deleteApplication: (id: string) => Promise<boolean>;

  // Local state management
  setApplications: (applications: Application[]) => void;
  addApplication: (application: Application) => void;
  updateApplicationInStore: (id: string, updates: Partial<Application>) => void;
  removeApplication: (id: string) => void;
  clearApplications: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ApplicationFilters>) => void;
  getFilteredApplications: () => Application[];
}

export const useApplicationsStore = create<ApplicationsState>()(
  devtools(
    (set, get) => ({
      applications: [],
      loading: false,
      error: null,
      filters: {},

      fetchApplications: async () => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await graphqlClient.query({
            query: GET_APPLICATIONS,
            fetchPolicy: 'network-only',
          });

          if (error) {
            set({ error: error.message, loading: false });
            return;
          }

          // Transform GraphQL data to match our Application type
          const applications = (data as any).applications.map((app: any) => ({
            ...app,
            companyName: app.companyName,
            targetDate: app.targetDate ? new Date(app.targetDate) : undefined,
            appliedDate: app.appliedDate ? new Date(app.appliedDate) : undefined,
            firstInterviewDate: app.firstInterviewDate
              ? new Date(app.firstInterviewDate)
              : undefined,
            offerDate: app.offerDate ? new Date(app.offerDate) : undefined,
            responseDeadline: app.responseDeadline ? new Date(app.responseDeadline) : undefined,
            createdAt: new Date(app.createdAt),
            updatedAt: new Date(app.updatedAt),
            salary: app.salaryMin
              ? {
                  min: app.salaryMin,
                  max: app.salaryMax,
                  currency: app.salaryCurrency,
                  period: app.salaryPeriod,
                }
              : undefined,
          }));

          set({ applications, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      fetchApplication: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await graphqlClient.query({
            query: GET_APPLICATION_BY_ID,
            variables: { id },
            fetchPolicy: 'network-only',
          });

          if (error) {
            set({ error: error.message, loading: false });
            return null;
          }

          if (!(data as any).application) {
            set({ error: 'Application not found', loading: false });
            return null;
          }

          const app = (data as any).application;
          const application: Application = {
            ...app,
            companyName: app.companyName,
            targetDate: app.targetDate ? new Date(app.targetDate) : undefined,
            appliedDate: app.appliedDate ? new Date(app.appliedDate) : undefined,
            firstInterviewDate: app.firstInterviewDate
              ? new Date(app.firstInterviewDate)
              : undefined,
            offerDate: app.offerDate ? new Date(app.offerDate) : undefined,
            responseDeadline: app.responseDeadline ? new Date(app.responseDeadline) : undefined,
            createdAt: new Date(app.createdAt),
            updatedAt: new Date(app.updatedAt),
            salary: app.salaryMin
              ? {
                  min: app.salaryMin,
                  max: app.salaryMax,
                  currency: app.salaryCurrency,
                  period: app.salaryPeriod,
                }
              : undefined,
            contacts: app.contacts || [],
            interviews: app.interviews || [],
            linkedDocuments: app.linkedDocuments || [],
          };

          set({ loading: false });
          return application;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          return null;
        }
      },

      createApplication: async (
        applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
      ) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await graphqlClient.mutate({
            mutation: CREATE_APPLICATION,
            variables: {
              input: {
                companyName: applicationData.companyName,
                position: applicationData.position,
                status: applicationData.status,
                targetDate: applicationData.targetDate?.toISOString(),
                appliedDate: applicationData.appliedDate?.toISOString(),
                firstInterviewDate: applicationData.firstInterviewDate?.toISOString(),
                offerDate: applicationData.offerDate?.toISOString(),
                responseDeadline: applicationData.responseDeadline?.toISOString(),
                location: applicationData.location,
                workType: applicationData.workType,
                employmentType: applicationData.employmentType,
                salaryMin: applicationData.salary?.min,
                salaryMax: applicationData.salary?.max,
                salaryCurrency: applicationData.salary?.currency,
                salaryPeriod: applicationData.salary?.period,
                jobUrl: applicationData.jobUrl,
                jobDescription: applicationData.jobDescription,
                notes: applicationData.notes,
                tags: applicationData.tags,
                priority: applicationData.priority,
                source: applicationData.source,
                referralName: applicationData.referralName,
                sortOrder: applicationData.sortOrder,
              },
            },
          });

          if (error) {
            set({ error: error.message, loading: false });
            return null;
          }

          const newApplication: Application = {
            ...(data as any).createApplication,
            companyName: (data as any).createApplication.companyName,
            targetDate: (data as any).createApplication.targetDate
              ? new Date((data as any).createApplication.targetDate)
              : undefined,
            appliedDate: (data as any).createApplication.appliedDate
              ? new Date((data as any).createApplication.appliedDate)
              : undefined,
            firstInterviewDate: (data as any).createApplication.firstInterviewDate
              ? new Date((data as any).createApplication.firstInterviewDate)
              : undefined,
            offerDate: (data as any).createApplication.offerDate
              ? new Date((data as any).createApplication.offerDate)
              : undefined,
            responseDeadline: (data as any).createApplication.responseDeadline
              ? new Date((data as any).createApplication.responseDeadline)
              : undefined,
            createdAt: new Date((data as any).createApplication.createdAt),
            updatedAt: new Date((data as any).createApplication.updatedAt),
            salary: (data as any).createApplication.salaryMin
              ? {
                  min: (data as any).createApplication.salaryMin,
                  max: (data as any).createApplication.salaryMax,
                  currency: (data as any).createApplication.salaryCurrency,
                  period: (data as any).createApplication.salaryPeriod,
                }
              : undefined,
          };

          // Add to local store
          const currentApplications = get().applications;
          set({ applications: [...currentApplications, newApplication], loading: false });

          return newApplication;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          return null;
        }
      },

      updateApplication: async (id: string, updates: Partial<Application>) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await graphqlClient.mutate({
            mutation: UPDATE_APPLICATION,
            variables: {
              id,
              input: {
                companyName: updates.companyName,
                position: updates.position,
                status: updates.status,
                targetDate: updates.targetDate?.toISOString(),
                appliedDate: updates.appliedDate?.toISOString(),
                firstInterviewDate: updates.firstInterviewDate?.toISOString(),
                offerDate: updates.offerDate?.toISOString(),
                responseDeadline: updates.responseDeadline?.toISOString(),
                location: updates.location,
                workType: updates.workType,
                employmentType: updates.employmentType,
                salaryMin: updates.salary?.min,
                salaryMax: updates.salary?.max,
                salaryCurrency: updates.salary?.currency,
                salaryPeriod: updates.salary?.period,
                jobUrl: updates.jobUrl,
                jobDescription: updates.jobDescription,
                notes: updates.notes,
                tags: updates.tags,
                priority: updates.priority,
                source: updates.source,
                referralName: updates.referralName,
                sortOrder: updates.sortOrder,
              },
            },
          });

          if (error) {
            set({ error: error.message, loading: false });
            return null;
          }

          const updatedApplication: Application = {
            ...(data as any).updateApplication,
            companyName: (data as any).updateApplication.companyName,
            targetDate: (data as any).updateApplication.targetDate
              ? new Date((data as any).updateApplication.targetDate)
              : undefined,
            appliedDate: (data as any).updateApplication.appliedDate
              ? new Date((data as any).updateApplication.appliedDate)
              : undefined,
            firstInterviewDate: (data as any).updateApplication.firstInterviewDate
              ? new Date((data as any).updateApplication.firstInterviewDate)
              : undefined,
            offerDate: (data as any).updateApplication.offerDate
              ? new Date((data as any).updateApplication.offerDate)
              : undefined,
            responseDeadline: (data as any).updateApplication.responseDeadline
              ? new Date((data as any).updateApplication.responseDeadline)
              : undefined,
            createdAt: new Date((data as any).updateApplication.createdAt),
            updatedAt: new Date((data as any).updateApplication.updatedAt),
            salary: (data as any).updateApplication.salaryMin
              ? {
                  min: (data as any).updateApplication.salaryMin,
                  max: (data as any).updateApplication.salaryMax,
                  currency: (data as any).updateApplication.salaryCurrency,
                  period: (data as any).updateApplication.salaryPeriod,
                }
              : undefined,
          };

          // Update local store
          const currentApplications = get().applications;
          const updatedApplications = currentApplications.map((app) =>
            app.id === id ? updatedApplication : app,
          );
          set({ applications: updatedApplications, loading: false });

          return updatedApplication;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          return null;
        }
      },

      deleteApplication: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await graphqlClient.mutate({
            mutation: DELETE_APPLICATION,
            variables: { id },
          });

          if (error) {
            set({ error: error.message, loading: false });
            return false;
          }

          // Remove from local store
          const currentApplications = get().applications;
          const updatedApplications = currentApplications.filter((app) => app.id !== id);
          set({ applications: updatedApplications, loading: false });

          return (data as any).deleteApplication;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          return false;
        }
      },

      // Local state management
      setApplications: (applications: Application[]) => set({ applications }),
      addApplication: (application: Application) => {
        const currentApplications = get().applications;
        set({ applications: [...currentApplications, application] });
      },
      updateApplicationInStore: (id: string, updates: Partial<Application>) => {
        const currentApplications = get().applications;
        const updatedApplications = currentApplications.map((app) =>
          app.id === id ? { ...app, ...updates } : app,
        );
        set({ applications: updatedApplications });
      },
      removeApplication: (id: string) => {
        const currentApplications = get().applications;
        const updatedApplications = currentApplications.filter((app) => app.id !== id);
        set({ applications: updatedApplications });
      },
      clearApplications: () => {
        set({ applications: [] });
      },
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      setFilters: (filters: Partial<ApplicationFilters>) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      getFilteredApplications: () => {
        const { applications, filters } = get();
        const search = (filters.searchQuery || '').toLowerCase();
        const statusSet = filters.status ? new Set(filters.status) : null;
        const prioritySet = filters.priority ? new Set(filters.priority) : null;
        const workTypeSet = filters.workType ? new Set(filters.workType) : null;
        const employmentTypeSet = filters.employmentType ? new Set(filters.employmentType) : null;

        return applications.filter((app) => {
          if (statusSet && !statusSet.has(app.status)) return false;
          if (prioritySet && (!app.priority || !prioritySet.has(app.priority))) return false;
          if (workTypeSet && (!app.workType || !workTypeSet.has(app.workType))) return false;
          if (
            employmentTypeSet &&
            (!app.employmentType || !employmentTypeSet.has(app.employmentType))
          )
            return false;

          if (filters.dateRange?.start || filters.dateRange?.end) {
            const applied = app.appliedDate ? new Date(app.appliedDate).getTime() : null;
            const start = filters.dateRange.start ? filters.dateRange.start.getTime() : null;
            const end = filters.dateRange.end ? filters.dateRange.end.getTime() : null;
            if (applied === null) return false;
            if (start !== null && applied < start) return false;
            if (end !== null && applied > end) return false;
          }

          if (filters.salaryRange) {
            const min = filters.salaryRange.min ?? null;
            const max = filters.salaryRange.max ?? null;
            const appMin = app.salary?.min ?? null;
            const appMax = app.salary?.max ?? appMin;
            if (min !== null && (appMax === null || appMax < min)) return false;
            if (max !== null && (appMin === null || appMin > max)) return false;
          }

          if (filters.tags && filters.tags.length > 0) {
            const appTags = app.tags || [];
            if (!filters.tags.some((t) => appTags.includes(t))) return false;
          }

          if (search) {
            const hay = `${app.position} ${app.companyName} ${app.location || ''}`.toLowerCase();
            if (!hay.includes(search)) return false;
          }

          return true;
        });
      },
    }),
    {
      name: 'applications-store',
    },
  ),
);
