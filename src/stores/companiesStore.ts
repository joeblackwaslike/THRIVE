import { gql } from '@apollo/client';
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql';
import type { Company } from '@/types';

const GET_COMPANIES = gql`
  query GetCompanies {
    companies {
      id
      name
      website
      industry
      size
      location
      founded
      remotePolicy
      description
      culture
      techStack
      benefits
      pros
      cons
      notes
      ratings
      status
      priority
      researched
      tags
      createdAt
      updatedAt
    }
  }
`;

const CREATE_COMPANY = gql`
  mutation CreateCompany($input: CompanyInput!) {
    createCompany(input: $input) {
      id
      name
      website
      industry
      size
      location
      founded
      remotePolicy
      description
      culture
      techStack
      benefits
      pros
      cons
      notes
      ratings
      status
      priority
      researched
      tags
      createdAt
      updatedAt
    }
  }
`;

interface CompaniesState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Company>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Company>;
}

export const useCompaniesStore = create<CompaniesState>((set, _get) => ({
  companies: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.query({ query: GET_COMPANIES });
      set({ companies: (data as any).companies || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  createCompany: async (company) => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.mutate({
        mutation: CREATE_COMPANY,
        variables: { input: company },
      });
      const newCompany = (data as any).createCompany;
      set((state) => ({
        companies: [...state.companies, newCompany],
        loading: false,
      }));
      return newCompany;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateCompany: async (id, company) => {
    set({ loading: true, error: null });
    try {
      const { data } = await graphqlClient.mutate({
        mutation: gql`
          mutation UpdateCompany($id: ID!, $input: CompanyUpdateInput!) {
            updateCompany(id: $id, input: $input) {
              id
              name
              website
              industry
              size
              location
              founded
              remotePolicy
              description
              culture
              techStack
              benefits
              pros
              cons
              notes
              ratings
              status
              priority
              researched
              tags
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id, input: company },
      });
      const updatedCompany = (data as any).updateCompany;
      set((state) => ({
        companies: state.companies.map((c) => (c.id === id ? updatedCompany : c)),
        loading: false,
      }));
      return updatedCompany;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteCompany: async (id) => {
    set({ loading: true, error: null });
    try {
      await graphqlClient.mutate({
        mutation: gql`mutation DeleteCompany($id: ID!) { deleteCompany(id: $id) }`,
        variables: { id },
      });
      set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  addCompany: async (company) => {
    const { data } = await graphqlClient.mutate({
      mutation: CREATE_COMPANY,
      variables: { input: company },
    });
    const newCompany = (data as any)?.createCompany;
    if (newCompany) {
      set((state) => ({
        companies: [...state.companies, newCompany],
        loading: false,
      }));
    }
    return newCompany;
  },
}));
