import { GraphQLError } from 'graphql';
import { contacts as contactsDb } from '../../lib/db.ts';
import { supabase } from '../../lib/supabase.ts';
import logger from '../../logger.ts';
import type {
  ContactQueryArgs,
  ContactRecord,
  Context,
  CreateContactArgs,
  DeleteContactArgs,
  UpdateContactArgs,
} from '../types.ts';

export const contactsResolver = {
  Query: {
    contacts: async (_: unknown, __: unknown, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') return [];
        return await contactsDb.getAll(userId);
      } catch (error) {
        logger.error('Error fetching contacts:', error);
        throw new GraphQLError(`Failed to fetch contacts: ${error}`);
      }
    },

    contact: async (_: unknown, { id }: ContactQueryArgs, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') return null;
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error('Error fetching contact:', error);
        throw new GraphQLError(`Failed to fetch contact: ${error}`);
      }
    },

    contactsByCompany: async (
      _: unknown,
      { companyId }: { companyId: string },
      { userId }: Context,
    ) => {
      try {
        if (!userId || userId === 'null') return [];
        return await contactsDb.getByCompanyId(companyId, userId);
      } catch (error) {
        logger.error('Error fetching contacts by company:', error);
        throw new GraphQLError(`Failed to fetch contacts by company: ${error}`);
      }
    },
  },

  Mutation: {
    createContact: async (_: unknown, { input }: CreateContactArgs, { userId }: Context) => {
      try {
        if (!userId || userId === 'null') throw new GraphQLError('Authentication required');
        const contactData = {
          ...input,
          user_id: userId,
          // Convert GraphQL field names to database column names
          company_id: input.companyId,
          company_name: input.companyName,
        };

        return await contactsDb.create(contactData);
      } catch (error) {
        logger.error('Error creating contact:', error);
        throw new GraphQLError(`Failed to create contact: ${error}`);
      }
    },

    updateContact: async (_: unknown, { id, input }: UpdateContactArgs, { userId }: Context) => {
      try {
        const updateData = {
          ...input,
          // Convert GraphQL field names to database column names
          company_id: input.companyId,
          company_name: input.companyName,
        };

        return await contactsDb.update(id, updateData, userId);
      } catch (error) {
        logger.error('Error updating contact:', error);
        throw new GraphQLError(`Failed to update contact: ${error}`);
      }
    },

    deleteContact: async (_: unknown, { id }: DeleteContactArgs, { userId }: Context) => {
      try {
        return await contactsDb.delete(id, userId);
      } catch (error) {
        logger.error('Error deleting contact:', error);
        throw new GraphQLError(`Failed to delete contact: ${error}`);
      }
    },
  },

  Contact: {
    userId: (parent: ContactRecord) => parent.user_id,
    companyId: (parent: ContactRecord) => parent.company_id,
    companyName: (parent: ContactRecord) => parent.company_name,
    createdAt: (parent: ContactRecord) => parent.created_at,
    updatedAt: (parent: ContactRecord) => parent.updated_at,

    company: async (parent: ContactRecord, _: unknown, { userId }: Context) => {
      if (!parent.company_id) return null;

      const { companies } = await import('../../lib/db');
      return await companies.getById(parent.company_id, userId);
    },
  },
};
