import logger from '../logger.ts';
import type { Database } from '../types/database.ts';
import { supabase } from './supabase.ts';

export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update'];

export type Interview = Database['public']['Tables']['interviews']['Row'];
export type InterviewInsert = Database['public']['Tables']['interviews']['Insert'];
export type InterviewUpdate = Database['public']['Tables']['interviews']['Update'];

export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

// Applications CRUD operations
export const applications = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching applications:', error);
      throw error;
    }
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error fetching application:', error);
      throw error;
    }
    return data;
  },

  async create(application: ApplicationInsert) {
    const { data, error } = await supabase
      .from('applications')
      .insert([application])
      .select()
      .single();

    if (error) {
      logger.error('Error creating application:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, application: ApplicationUpdate, userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .update(application)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating application:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting application:', error);
      throw error;
    }
    return true;
  },

  async getByStatus(userId: string, status: Application['status']) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching applications by status:', error);
      throw error;
    }
    return data;
  },
};

// Interviews CRUD operations
export const interviews = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Error fetching interviews:', error);
      throw error;
    }
    return data;
  },

  async getByApplicationId(applicationId: string, userId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('application_id', applicationId)
      .eq('user_id', userId)
      .order('scheduled_at', { ascending: true });

    if (error) {
      logger.error('Error fetching interviews by application ID:', error);
      throw error;
    }
    return data;
  },

  async create(interview: InterviewInsert) {
    const { data, error } = await supabase.from('interviews').insert(interview).select().single();

    if (error) {
      logger.error('Error creating interview:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, interview: InterviewUpdate, userId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .update(interview)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating interview:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase.from('interviews').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      logger.error('Error deleting interview:', error);
      throw error;
    }
    return true;
  },
};

// Companies CRUD operations
export const companies = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching companies:', error);
      throw error;
    }
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error fetching company:', error);
      throw error;
    }
    return data;
  },

  async create(company: CompanyInsert) {
    const { data, error } = await supabase.from('companies').insert(company).select().single();

    if (error) {
      logger.error('Error creating company:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, company: CompanyUpdate, userId: string) {
    const { data, error } = await supabase
      .from('companies')
      .update(company)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating company:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase.from('companies').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      logger.error('Error deleting company:', error);
      throw error;
    }
    return true;
  },
};

// Contacts CRUD operations
export const contacts = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching contacts:', error);
      throw error;
    }
    return data;
  },

  async getByCompanyId(companyId: string, userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching contacts by company ID:', error);
      throw error;
    }
    return data;
  },

  async create(contact: ContactInsert) {
    const { data, error } = await supabase.from('contacts').insert(contact).select().single();

    if (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, contact: ContactUpdate, userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string, userId: string) {
    const { error } = await supabase.from('contacts').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      logger.error('Error deleting contact:', error);
      throw error;
    }
    return true;
  },
};

// Documents CRUD operations
export const documents = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching documents:', error);
      throw error;
    }
    return data;
  },

  async getById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Error fetching document:', error);
      throw error;
    }
    return data;
  },

  async create(document: DocumentInsert) {
    const { data, error } = await supabase.from('documents').insert(document).select().single();

    if (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, document: DocumentUpdate, userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .update(document)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string, userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
    return data;
  },

  async getVersions(baseDocumentId: string, userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('base_document_id', baseDocumentId)
      .eq('user_id', userId)
      .order('version', { ascending: true });

    if (error) {
      logger.error('Error fetching document versions:', error);
      throw error;
    }
    return data;
  },
};

// Analytics functions
export const analytics = {
  async getApplicationStats(userId: string) {
    // Get basic stats by counting records
    const { count: total, error: totalError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      logger.error('Error fetching application stats:', totalError);
      throw totalError;
    }

    // Get status counts
    const { data: statusData, error: statusError } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);

    if (statusError) {
      logger.error('Error fetching application statuses:', statusError);
      throw statusError;
    }

    // Count by status
    const byStatus =
      statusData?.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return {
      total: total || 0,
      byStatus,
      activeApplications: (byStatus.applied || 0) + (byStatus.interviewing || 0),
      interviewsScheduled: 0, // Will be calculated separately
      offersReceived: (byStatus.offer || 0) + (byStatus.accepted || 0),
    };
  },

  async getApplicationsByStatus(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching application statuses:', error);
      throw error;
    }

    // Group by status manually
    const grouped =
      data?.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  },

  async getApplicationsOverTime(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('created_at, status')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching applications over time:', error);
      throw error;
    }
    return data;
  },
};

export default {
  applications,
  interviews,
  companies,
  contacts,
  documents,
  analytics,
};
