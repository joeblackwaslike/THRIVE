import { GraphQLError } from 'graphql';
import { applications as applicationsDb } from '../../lib/db.ts';
import logger from '../../logger.ts';
import type {
  ApplicationQueryArgs,
  ApplicationRecord,
  Context,
  CreateApplicationArgs,
  DeleteApplicationArgs,
  UpdateApplicationArgs,
} from '../types.ts';

export const applicationsResolver = {
  Query: {
    applications: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        return await applicationsDb.getAll(userId);
      } catch (error) {
        logger.error('Error fetching applications:', error);
        throw new GraphQLError(`Failed to fetch applications: ${error}`);
      }
    },

    application: async (_: unknown, { id }: ApplicationQueryArgs, { userId }: Context) => {
      try {
        return await applicationsDb.getById(id, userId);
      } catch (error) {
        logger.error('Error fetching application:', error);
        throw new GraphQLError(`Failed to fetch application: ${error}`);
      }
    },

    applicationsByStatus: async (
      _: unknown,
      { status }: ApplicationQueryArgs,
      { userId }: Context
    ) => {
      try {
        return await applicationsDb.getByStatus(userId, status);
      } catch (error) {
        logger.error('Error fetching applications by status:', error);
        throw new GraphQLError(`Failed to fetch applications by status: ${error}`);
      }
    },
  },

  Mutation: {
    createApplication: async (
      _: unknown,
      { input }: CreateApplicationArgs,
      { userId }: Context
    ) => {
      try {
        const applicationData = {
          user_id: userId,
          company_name: input.companyName,
          position: input.position,
          status: input.status || 'target',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(input.workType && { work_type: input.workType }),
          ...(input.employmentType && { employment_type: input.employmentType }),
          ...(input.salaryCurrency && { salary_currency: input.salaryCurrency }),
          ...(input.salaryPeriod && { salary_period: input.salaryPeriod }),
          ...(input.jobUrl && { job_url: input.jobUrl }),
          ...(input.jobDescription && { job_description: input.jobDescription }),
          ...(input.referralName && { referral_name: input.referralName }),
          ...(input.sortOrder && { sort_order: input.sortOrder }),
          ...(input.targetDate && { target_date: input.targetDate }),
          ...(input.appliedDate && { applied_date: input.appliedDate }),
          ...(input.firstInterviewDate && { first_interview_date: input.firstInterviewDate }),
          ...(input.offerDate && { offer_date: input.offerDate }),
          ...(input.responseDeadline && { response_deadline: input.responseDeadline }),
        };

        return await applicationsDb.create(applicationData);
      } catch (error) {
        logger.error('Error creating application:', error);
        throw new GraphQLError(`Failed to create application: ${error}`);
      }
    },

    updateApplication: async (
      _: unknown,
      { id, input }: UpdateApplicationArgs,
      { userId }: Context
    ) => {
      try {
        const updateData = {
          company_name: input.companyName,
          position: input.position,
          status: input.status,
          work_type: input.workType,
          employment_type: input.employmentType,
          salary_currency: input.salaryCurrency,
          salary_period: input.salaryPeriod,
          job_url: input.jobUrl,
          job_description: input.jobDescription,
          referral_name: input.referralName,
          sort_order: input.sortOrder,
          target_date: input.targetDate,
          applied_date: input.appliedDate,
          first_interview_date: input.firstInterviewDate,
          offer_date: input.offerDate,
          response_deadline: input.responseDeadline,
          updated_at: new Date().toISOString(),
        };

        return await applicationsDb.update(id, updateData, userId);
      } catch (error) {
        logger.error('Error updating application:', error);
        throw new GraphQLError(`Failed to update application: ${error}`);
      }
    },

    deleteApplication: async (_: unknown, { id }: DeleteApplicationArgs, { userId }: Context) => {
      try {
        return await applicationsDb.delete(id, userId);
      } catch (error) {
        logger.error('Error deleting application:', error);
        throw new GraphQLError(`Failed to delete application: ${error}`);
      }
    },
  },

  Application: {
    interviews: async (parent: ApplicationRecord, _: unknown, { userId }: Context) => {
      const { interviews } = await import('../../lib/db');
      return await interviews.getByApplicationId(parent.id, userId);
    },

    linkedDocuments: async (_parent: ApplicationRecord, _: unknown, _context: Context) => {
      // This would require a join table or additional query
      // For now, return empty array - implement based on your needs
      return [];
    },

    userId: (parent: ApplicationRecord) => parent.user_id,
    companyName: (parent: ApplicationRecord) => parent.company_name,
    targetDate: (parent: ApplicationRecord) => parent.target_date,
    appliedDate: (parent: ApplicationRecord) => parent.applied_date,
    firstInterviewDate: (parent: ApplicationRecord) => parent.first_interview_date,
    offerDate: (parent: ApplicationRecord) => parent.offer_date,
    responseDeadline: (parent: ApplicationRecord) => parent.response_deadline,
    workType: (parent: ApplicationRecord) => parent.work_type,
    employmentType: (parent: ApplicationRecord) => parent.employment_type,
    salaryMin: (parent: ApplicationRecord) => parent.salary_min,
    salaryMax: (parent: ApplicationRecord) => parent.salary_max,
    salaryCurrency: (parent: ApplicationRecord) => parent.salary_currency,
    salaryPeriod: (parent: ApplicationRecord) => parent.salary_period,
    jobUrl: (parent: ApplicationRecord) => parent.job_url,
    jobDescription: (parent: ApplicationRecord) => parent.job_description,
    referralName: (parent: ApplicationRecord) => parent.referral_name,
    sortOrder: (parent: ApplicationRecord) => parent.sort_order,
    createdAt: (parent: ApplicationRecord) => parent.created_at,
    updatedAt: (parent: ApplicationRecord) => parent.updated_at,
  },
};
