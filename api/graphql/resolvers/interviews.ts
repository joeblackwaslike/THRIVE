import { GraphQLError } from 'graphql';
import { interviews as interviewsDb } from '../../lib/db.ts';
import { supabase } from '../../lib/supabase.ts';
import logger from '../../logger.ts';
import type {
  Context,
  CreateInterviewArgs,
  DeleteInterviewArgs,
  InterviewQueryArgs,
  InterviewRecord,
  UpdateInterviewArgs,
} from '../types.ts';

export const interviewsResolver = {
  Query: {
    interviews: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        return await interviewsDb.getAll(userId);
      } catch (_error) {
        logger.error('Error fetching interviews:', _error);
        return [];
      }
    },

    interview: async (_: unknown, { id }: InterviewQueryArgs, { userId }: Context) => {
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) {
          logger.error('Error fetching interview:', error);
          throw error;
        }
        return data as any;
      } catch (_error) {
        logger.error('Error fetching interview:', _error);
        return null;
      }
    },

    interviewsByApplication: async (
      _: unknown,
      { applicationId }: { applicationId: string },
      { userId }: Context
    ) => {
      try {
        return await interviewsDb.getByApplicationId(applicationId, userId);
      } catch (_error) {
        logger.error('Error fetching interviews by application:', _error);
        return [];
      }
    },
  },

  Mutation: {
    createInterview: async (_: unknown, { input }: CreateInterviewArgs, { userId }: Context) => {
      try {
        const interviewData = {
          ...input,
          user_id: userId,
          // Convert GraphQL enum values to database values
          scheduled_at: input.scheduledAt,
          preparation_notes: input.preparationNotes,
          questions_asked: input.questionsAsked,
          questions_to_ask: input.questionsToAsk,
          follow_up_sent: input.followUpSent,
          follow_up_date: input.followUpDate,
        };

        return await interviewsDb.create(interviewData);
      } catch (_error) {
        logger.error('Error creating interview:', _error);
        throw new GraphQLError(`Failed to create interview: ${_error}`);
      }
    },

    updateInterview: async (
      _: unknown,
      { id, input }: UpdateInterviewArgs,
      { userId }: Context
    ) => {
      try {
        const updateData = {
          ...input,
          // Convert GraphQL enum values to database values
          scheduled_at: input.scheduledAt,
          preparation_notes: input.preparationNotes,
          questions_asked: input.questionsAsked,
          questions_to_ask: input.questionsToAsk,
          follow_up_sent: input.followUpSent,
          follow_up_date: input.followUpDate,
        };

        return await interviewsDb.update(id, updateData, userId);
      } catch (_error) {
        logger.error('Error updating interview:', _error);
        throw new GraphQLError(`Failed to update interview: ${_error}`);
      }
    },

    deleteInterview: async (_: unknown, { id }: DeleteInterviewArgs, { userId }: Context) => {
      try {
        return await interviewsDb.delete(id, userId);
      } catch (_error) {
        logger.error('Error deleting interview:', _error);
        throw new GraphQLError(`Failed to delete interview: ${_error}`);
      }
    },
  },

  Interview: {
    userId: (parent: InterviewRecord) => parent.user_id,
    applicationId: (parent: InterviewRecord) => parent.application_id,
    scheduledAt: (parent: InterviewRecord) => parent.scheduled_at,
    preparationNotes: (parent: InterviewRecord) => parent.preparation_notes,
    questionsAsked: (parent: InterviewRecord) => parent.questions_asked,
    questionsToAsk: (parent: InterviewRecord) => parent.questions_to_ask,
    followUpSent: (parent: InterviewRecord) => parent.follow_up_sent,
    followUpDate: (parent: InterviewRecord) => parent.follow_up_date,
    createdAt: (parent: InterviewRecord) => parent.created_at,
    updatedAt: (parent: InterviewRecord) => parent.updated_at,

    application: async (parent: InterviewRecord, _: unknown, { userId }: Context) => {
      const { applications } = await import('../../lib/db');
      return await applications.getById(parent.application_id, userId);
    },

    interviewers: async (parent: InterviewRecord, _: unknown, _context: Context) => {
      // Interviewers are stored as JSON in the interview record
      return parent.interviewers || [];
    },
  },
};
