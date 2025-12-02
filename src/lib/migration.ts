import { db } from './db';
import { supabase } from './supabase';

/**
 * Migration utility to transfer data from Dexie (local IndexedDB) to Supabase
 */
export class DexieToSupabaseMigrator {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async migrateAll(): Promise<void> {
    console.log('Starting migration from Dexie to Supabase...');

    try {
      // Migrate in order of dependencies
      await this.migrateCompanies();
      await this.migrateContacts();
      await this.migrateApplications();
      await this.migrateInterviews();
      await this.migrateDocuments();

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async migrateCompanies(): Promise<void> {
    console.log('Migrating companies...');

    const companies = await db.companies.toArray();
    console.log(`Found ${companies.length} companies to migrate`);

    for (const company of companies) {
      const companyData = {
        id: company.id,
        user_id: this.userId,
        name: company.name,
        website: company.website || null,
        industry: company.industry || null,
        size: company.size || null,
        location: company.location || null,
        founded: company.founded || null,
        remote_policy: company.remotePolicy || null,
        description: company.description || null,
        culture: company.culture || null,
        culture_notes: company.cultureNotes || null,
        tech_stack: company.techStack || null,
        benefits: company.benefits || null,
        pros: company.pros || null,
        cons: company.cons || null,
        notes: company.notes || null,
        employee_reviews: company.employeeReviews || null,
        news_and_updates: company.newsAndUpdates || null,
        competitor_comparison: company.competitorComparison || null,
        company_links: company.companyLinks || null,
        ratings: company.ratings || null,
        ats_params: company.atsParams || null,
        interview_process: company.interviewProcess || null,
        interview_difficulty: company.interviewDifficulty || null,
        interview_experience: company.interviewExperience || null,
        salary_range: company.salaryRange || null,
        status: company.status || 'target',
        priority: company.priority || 'medium',
        researched: company.researched || false,
        tags: company.tags || null,
        created_at: company.createdAt.toISOString(),
        updated_at: company.updatedAt.toISOString(),
      };

      const { error } = await supabase.from('companies').insert(companyData);
      if (error) {
        console.error(`Failed to migrate company ${company.id}:`, error);
        throw error;
      }
    }

    console.log(`Migrated ${companies.length} companies`);
  }

  async migrateContacts(): Promise<void> {
    console.log('Migrating contacts...');

    const contacts = await db.contacts.toArray();
    console.log(`Found ${contacts.length} contacts to migrate`);

    for (const contact of contacts) {
      const contactData = {
        id: contact.id,
        user_id: this.userId,
        name: contact.name,
        company_id: contact.companyId || null,
        company_name: contact.companyName || null,
        title: contact.title || null,
        email: contact.email || null,
        phone: contact.phone || null,
        linkedin: contact.linkedIn || null,
        notes: contact.notes || null,
        relationship: contact.relationship || null,
        created_at: contact.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: contact.updatedAt?.toISOString() || new Date().toISOString(),
      };

      const { error } = await supabase.from('contacts').insert(contactData);
      if (error) {
        console.error(`Failed to migrate contact ${contact.id}:`, error);
        throw error;
      }
    }

    console.log(`Migrated ${contacts.length} contacts`);
  }

  async migrateApplications(): Promise<void> {
    console.log('Migrating applications...');

    const applications = await db.applications.toArray();
    console.log(`Found ${applications.length} applications to migrate`);

    for (const application of applications) {
      const applicationData = {
        id: application.id,
        user_id: this.userId,
        company_name: application.companyName,
        position: application.position,
        status: application.status,
        target_date: application.targetDate?.toISOString().split('T')[0] || null,
        applied_date: application.appliedDate?.toISOString().split('T')[0] || null,
        first_interview_date: application.firstInterviewDate?.toISOString().split('T')[0] || null,
        offer_date: application.offerDate?.toISOString().split('T')[0] || null,
        response_deadline: application.responseDeadline?.toISOString().split('T')[0] || null,
        location: application.location || null,
        work_type: application.workType || null,
        employment_type: application.employmentType || null,
        salary_min: application.salary?.min || null,
        salary_max: application.salary?.max || null,
        salary_currency: application.salary?.currency || 'USD',
        salary_period: application.salary?.period || null,
        job_url: application.jobUrl || null,
        job_description: application.jobDescription || null,
        notes: application.notes || null,
        tags: application.tags || null,
        priority: application.priority || 'medium',
        source: application.source || null,
        referral_name: application.referralName || null,
        sort_order: application.sortOrder || null,
        created_at: application.createdAt.toISOString(),
        updated_at: application.updatedAt.toISOString(),
      };

      const { error } = await supabase.from('applications').insert(applicationData);
      if (error) {
        console.error(`Failed to migrate application ${application.id}:`, error);
        throw error;
      }
    }

    console.log(`Migrated ${applications.length} applications`);
  }

  async migrateInterviews(): Promise<void> {
    console.log('Migrating interviews...');

    const interviews = await db.interviews.toArray();
    console.log(`Found ${interviews.length} interviews to migrate`);

    for (const interview of interviews) {
      const interviewData = {
        id: interview.id,
        user_id: this.userId,
        application_id: interview.applicationId,
        round: interview.round,
        type: interview.type,
        status: interview.status,
        scheduled_at: interview.scheduledAt ? new Date(interview.scheduledAt).toISOString() : null,
        duration: interview.duration || null,
        location: interview.location || null,
        meeting_url: interview.meetingUrl || null,
        preparation_notes: interview.preparationNotes || null,
        questions_asked: interview.questionsAsked || null,
        questions_to_ask: interview.questionsToAsk || null,
        feedback: interview.feedback || null,
        follow_up_sent: interview.followUpSent || false,
        follow_up_date: interview.followUpDate
          ? new Date(interview.followUpDate).toISOString().split('T')[0]
          : null,
        result: interview.result || null,
        created_at: interview.createdAt.toISOString(),
        updated_at: interview.updatedAt.toISOString(),
      };

      const { error } = await supabase.from('interviews').insert(interviewData);
      if (error) {
        console.error(`Failed to migrate interview ${interview.id}:`, error);
        throw error;
      }

      // Note: Interviewers migration skipped as table doesn't exist in current schema
    }

    console.log(`Migrated ${interviews.length} interviews`);
  }

  async migrateDocuments(): Promise<void> {
    console.log('Migrating documents...');

    const documents = await db.documents.toArray();
    console.log(`Found ${documents.length} documents to migrate`);

    for (const document of documents) {
      const documentData = {
        id: document.id,
        user_id: this.userId,
        name: document.name,
        type: document.type,
        file_name: document.fileName || null,
        file_url: document.fileUrl || document.url || null,
        url: document.url || null,
        file_size: document.fileSize || null,
        mime_type: document.mimeType || null,
        content: document.content || null,
        version: document.version,
        version_name: document.versionName || null,
        base_document_id: document.baseDocumentId || null,
        application_id: document.applicationId || null,
        used_in_application_ids: document.usedInApplicationIds || null,
        last_used_date: document.lastUsedDate
          ? new Date(document.lastUsedDate).toISOString().split('T')[0]
          : null,
        tags: document.tags || null,
        notes: document.notes || null,
        deleted_at: document.deletedAt ? new Date(document.deletedAt).toISOString() : null,
        created_at: document.createdAt.toISOString(),
        updated_at: document.updatedAt.toISOString(),
      };

      const { error } = await supabase.from('documents').insert(documentData);
      if (error) {
        console.error(`Failed to migrate document ${document.id}:`, error);
        throw error;
      }

      // Note: Document version links migration skipped as table doesn't exist in current schema
    }

    console.log(`Migrated ${documents.length} documents`);
  }

  async verifyMigration(): Promise<boolean> {
    console.log('Verifying migration...');

    // Get counts from both databases
    const dexieCounts = {
      applications: await db.applications.count(),
      interviews: await db.interviews.count(),
      companies: await db.companies.count(),
      contacts: await db.contacts.count(),
      documents: await db.documents.count(),
    };

    // Get counts from Supabase individually since RPC function doesn't exist
    const supabaseCounts = {
      applications:
        (await supabase.from('applications').select('id', { count: 'exact' })).count || 0,
      interviews: (await supabase.from('interviews').select('id', { count: 'exact' })).count || 0,
      companies: (await supabase.from('companies').select('id', { count: 'exact' })).count || 0,
      contacts: (await supabase.from('contacts').select('id', { count: 'exact' })).count || 0,
      documents: (await supabase.from('documents').select('id', { count: 'exact' })).count || 0,
    };

    console.log('Migration verification results:');
    console.log('Applications:', dexieCounts.applications, '->', supabaseCounts.applications);
    console.log('Interviews:', dexieCounts.interviews, '->', supabaseCounts.interviews);
    console.log('Companies:', dexieCounts.companies, '->', supabaseCounts.companies);
    console.log('Contacts:', dexieCounts.contacts, '->', supabaseCounts.contacts);
    console.log('Documents:', dexieCounts.documents, '->', supabaseCounts.documents);

    // Check if counts match
    const success =
      dexieCounts.applications === supabaseCounts.applications &&
      dexieCounts.interviews === supabaseCounts.interviews &&
      dexieCounts.companies === supabaseCounts.companies &&
      dexieCounts.contacts === supabaseCounts.contacts &&
      dexieCounts.documents === supabaseCounts.documents;

    return success;
  }
}

// Usage example
export async function runMigration(userId: string = 'test-user-id'): Promise<void> {
  const migrator = new DexieToSupabaseMigrator(userId);

  try {
    await migrator.migrateAll();
    const success = await migrator.verifyMigration();

    if (success) {
      console.log('✅ Migration completed successfully and verified!');
    } else {
      console.log('⚠️ Migration completed but verification failed. Please check the data.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
