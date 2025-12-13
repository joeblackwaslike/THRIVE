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
        if (!userId || userId === 'null') {
          return [];
        }
        return await companiesDb.getAll(userId);
      } catch (_error) {
        logger.error('Error fetching companies:', _error);
        return [];
      }
    },

    company: async (_: unknown, { id }: CompanyQueryArgs, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') {
          return null;
        }
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
        if (!userId || userId === 'null') {
          throw new GraphQLError('Authentication required');
        }
        const companyData = {
          user_id: userId,
          name: input.name,
          website: input.website,
          industry: input.industry,
          size: input.size,
          location: input.location,
          founded: input.founded,
          remote_policy: input.remotePolicy,
          description: input.description,
          culture: input.culture,
          culture_notes: input.cultureNotes,
          tech_stack: input.techStack,
          benefits: input.benefits,
          pros: input.pros,
          cons: input.cons,
          notes: input.notes,
          employee_reviews: input.employeeReviews,
          news_and_updates: input.newsAndUpdates,
          competitor_comparison: input.competitorComparison,
          company_links: input.companyLinks,
          ats_params: input.atsParams,
          interview_process: input.interviewProcess,
          interview_difficulty: input.interviewDifficulty,
          interview_experience: input.interviewExperience,
          salary_range: input.salaryRange,
          status: input.status,
          priority: input.priority,
          researched: input.researched !== undefined ? input.researched : false,
          tags: input.tags,
        };

        return await companiesDb.create(companyData);
      } catch (error: any) {
        logger.error('Error creating company:', error);
        throw new GraphQLError(`Failed to create company: ${error.message || JSON.stringify(error)}`);
      }
    },

    updateCompany: async (_: unknown, { id, input }: UpdateCompanyArgs, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') {
          throw new GraphQLError('Authentication required');
        }
        const updateData: any = {
          // Explicitly map fields to avoid sending unknown columns from GraphQL input
          ...(input.name !== undefined && { name: input.name }),
          ...(input.website !== undefined && { website: input.website }),
          ...(input.industry !== undefined && { industry: input.industry }),
          ...(input.size !== undefined && { size: input.size }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.founded !== undefined && { founded: input.founded }),
          ...(input.remotePolicy !== undefined && { remote_policy: input.remotePolicy }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.culture !== undefined && { culture: input.culture }),
          ...(input.cultureNotes !== undefined && { culture_notes: input.cultureNotes }),
          ...(input.techStack !== undefined && { tech_stack: input.techStack }),
          ...(input.benefits !== undefined && { benefits: input.benefits }),
          ...(input.pros !== undefined && { pros: input.pros }),
          ...(input.cons !== undefined && { cons: input.cons }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.employeeReviews !== undefined && { employee_reviews: input.employeeReviews }),
          ...(input.newsAndUpdates !== undefined && { news_and_updates: input.newsAndUpdates }),
          ...(input.competitorComparison !== undefined && { competitor_comparison: input.competitorComparison }),
          ...(input.companyLinks !== undefined && { company_links: input.companyLinks }),
          ...(input.atsParams !== undefined && { ats_params: input.atsParams }),
          ...(input.interviewProcess !== undefined && { interview_process: input.interviewProcess }),
          ...(input.interviewDifficulty !== undefined && { interview_difficulty: input.interviewDifficulty }),
          ...(input.interviewExperience !== undefined && { interview_experience: input.interviewExperience }),
          ...(input.salaryRange !== undefined && { salary_range: input.salaryRange }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.researched !== undefined && { researched: input.researched }),
          ...(input.tags !== undefined && { tags: input.tags }),
        };

        return await companiesDb.update(id, updateData, userId);
      } catch (error) {
        logger.error('Error updating company:', error);
        throw new GraphQLError(`Failed to update company: ${error}`);
      }
    },

    deleteCompany: async (_: unknown, { id }: DeleteCompanyArgs, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') {
          throw new GraphQLError('Authentication required');
        }
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
