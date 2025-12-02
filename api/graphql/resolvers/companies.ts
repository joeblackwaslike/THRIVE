import { GraphQLError } from 'graphql';
import { companies as companiesDb } from '../../lib/db.ts';
import logger from '../../logger.ts';
import type {
  CompanyQueryArgs,
  CompanyRecord,
  Context,
  CreateCompanyArgs,
  DeleteCompanyArgs,
  UpdateCompanyArgs,
} from '../types.ts';

export const companiesResolver = {
  Query: {
    companies: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        return await companiesDb.getAll(userId);
      } catch (_error) {
        logger.error('Error fetching companies:', _error);
        return [];
      }
    },

    company: async (_: unknown, { id }: CompanyQueryArgs, { userId }: Context) => {
      try {
        return await companiesDb.getById(id, userId);
      } catch (_error) {
        logger.error('Error fetching company:', _error);
        return null;
      }
    },
  },

  Mutation: {
    createCompany: async (_: unknown, { input }: CreateCompanyArgs, { userId }: Context) => {
      try {
        const companyData = {
          ...input,
          user_id: userId,
          // Convert GraphQL field names to database column names
          remote_policy: input.remotePolicy,
          culture_notes: input.cultureNotes,
          tech_stack: input.techStack,
          employee_reviews: input.employeeReviews,
          news_and_updates: input.newsAndUpdates,
          competitor_comparison: input.competitorComparison,
          company_links: input.companyLinks,
          ats_params: input.atsParams,
          interview_process: input.interviewProcess,
          interview_difficulty: input.interviewDifficulty,
          interview_experience: input.interviewExperience,
          salary_range: input.salaryRange,
        };

        return await companiesDb.create(companyData);
      } catch (error) {
        logger.error('Error creating company:', error);
        throw new GraphQLError(`Failed to create company: ${error}`);
      }
    },

    updateCompany: async (_: unknown, { id, input }: UpdateCompanyArgs, { userId }: Context) => {
      try {
        const updateData = {
          ...input,
          // Convert GraphQL field names to database column names
          remote_policy: input.remotePolicy,
          culture_notes: input.cultureNotes,
          tech_stack: input.techStack,
          employee_reviews: input.employeeReviews,
          news_and_updates: input.newsAndUpdates,
          competitor_comparison: input.competitorComparison,
          company_links: input.companyLinks,
          ats_params: input.atsParams,
          interview_process: input.interviewProcess,
          interview_difficulty: input.interviewDifficulty,
          interview_experience: input.interviewExperience,
          salary_range: input.salaryRange,
        };

        return await companiesDb.update(id, updateData, userId);
      } catch (error) {
        logger.error('Error updating company:', error);
        throw new GraphQLError(`Failed to update company: ${error}`);
      }
    },

    deleteCompany: async (_: unknown, { id }: DeleteCompanyArgs, { userId }: Context) => {
      try {
        return await companiesDb.delete(id, userId);
      } catch (error) {
        logger.error('Error deleting company:', error);
        throw new GraphQLError(`Failed to delete company: ${error}`);
      }
    },
  },

  Company: {
    userId: (parent: CompanyRecord) => parent.user_id,
    remotePolicy: (parent: CompanyRecord) => parent.remote_policy,
    cultureNotes: (parent: CompanyRecord) => parent.culture_notes,
    techStack: (parent: CompanyRecord) => parent.tech_stack,
    employeeReviews: (parent: CompanyRecord) => parent.employee_reviews,
    newsAndUpdates: (parent: CompanyRecord) => parent.news_and_updates,
    competitorComparison: (parent: CompanyRecord) => parent.competitor_comparison,
    companyLinks: (parent: CompanyRecord) => parent.company_links,
    atsParams: (parent: CompanyRecord) => parent.ats_params,
    interviewProcess: (parent: CompanyRecord) => parent.interview_process,
    interviewDifficulty: (parent: CompanyRecord) => parent.interview_difficulty,
    interviewExperience: (parent: CompanyRecord) => parent.interview_experience,
    salaryRange: (parent: CompanyRecord) => parent.salary_range,
    createdAt: (parent: CompanyRecord) => parent.created_at,
    updatedAt: (parent: CompanyRecord) => parent.updated_at,

    contacts: async (parent: CompanyRecord, _: unknown, { userId }: Context) => {
      const { contacts } = await import('../../lib/db');
      return await contacts.getByCompanyId(parent.id, userId);
    },
  },
};
