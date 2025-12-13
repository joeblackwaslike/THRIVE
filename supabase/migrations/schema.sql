-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE application_status AS ENUM(
  'target',
  'hunting',
  'applied',
  'interviewing',
  'offer',
  'accepted',
  'rejected',
  'withdrawn'
);

CREATE TYPE work_type AS ENUM(
  'remote',
  'hybrid',
  'onsite'
);

CREATE TYPE employment_type AS ENUM(
  'full-time',
  'part-time',
  'contract',
  'internship'
);

CREATE TYPE salary_period AS ENUM(
  'hourly',
  'annual'
);

CREATE TYPE priority AS ENUM(
  'low',
  'medium',
  'high'
);

CREATE TYPE interview_type AS ENUM(
  'recruiter-screen',
  'phone-screen',
  'hiring-manager-chat',
  'video',
  'technical-assessment',
  'on-site',
  'technical-interview',
  'behavioral-interview',
  'leadership-interview',
  'panel',
  'final',
  'other'
);

CREATE TYPE interview_status AS ENUM(
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled',
  'no-show'
);

CREATE TYPE interview_result AS ENUM(
  'passed',
  'failed',
  'pending'
);

CREATE TYPE company_status AS ENUM(
  'target',
  'researching',
  'applied',
  'interviewing',
  'rejected',
  'not-interested'
);

CREATE TYPE contact_relationship AS ENUM(
  'recruiter',
  'hiring-manager',
  'employee',
  'referral',
  'other'
);

CREATE TYPE difficulty AS ENUM(
  'easy',
  'medium',
  'hard'
);

CREATE TYPE experience AS ENUM(
  'positive',
  'neutral',
  'negative'
);

CREATE TYPE document_type AS ENUM(
  'resume',
  'cv',
  'cover-letter',
  'portfolio',
  'transcript',
  'certification',
  'other'
);

CREATE TYPE remote_policy AS ENUM(
  'full-remote',
  'hybrid',
  'on-site',
  'flexible'
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users(
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  preferences jsonb
);

CREATE TABLE public.applications(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  position text NOT NULL,
  status application_status NOT NULL DEFAULT 'target'::application_status,
  target_date date,
  applied_date date,
  first_interview_date date,
  offer_date date,
  response_deadline date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location text,
  work_type work_type,
  employment_type employment_type,
  salary_min integer,
  salary_max integer,
  salary_currency text DEFAULT 'USD'::text,
  salary_period salary_period,
  job_url text,
  job_description text,
  notes text,
  tags text[],
  priority priority DEFAULT 'medium'::priority,
  source text,
  referral_name text,
  sort_order integer,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.companies(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  industry text[],
  size text,
  location text,
  founded text,
  remote_policy remote_policy,
  description text,
  culture text,
  culture_notes text,
  tech_stack text[],
  benefits text[],
  pros text[],
  cons text[],
  notes text,
  employee_reviews text,
  news_and_updates text,
  competitor_comparison text,
  company_links jsonb,
  ratings jsonb,
  ats_params jsonb,
  interview_process text,
  interview_difficulty difficulty,
  interview_experience experience,
  salary_range jsonb,
  status company_status DEFAULT 'target'::company_status,
  priority priority DEFAULT 'medium'::priority,
  researched boolean DEFAULT FALSE,
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.contacts(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text,
  email text,
  phone text,
  linkedin text,
  notes text,
  relationship contact_relationship,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

CREATE TABLE public.document_version_links(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type document_type NOT NULL,
  version integer NOT NULL,
  version_name text,
  linked_at timestamp with time zone DEFAULT now(),
  content text,
  CONSTRAINT document_version_links_pkey PRIMARY KEY (id),
  CONSTRAINT document_version_links_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT document_version_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);

CREATE TABLE public.documents(
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type document_type NOT NULL,
  file_name text,
  file_url text,
  url text,
  file_size integer,
  mime_type text,
  content text,
  version integer DEFAULT 1,
  version_name text,
  base_document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  used_in_application_ids uuid[],
  last_used_date date,
  tags text[],
  notes text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT documents_base_document_id_fkey FOREIGN KEY (base_document_id) REFERENCES public.documents(id),
  CONSTRAINT documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);

CREATE TABLE public.interviewers(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id uuid NOT NULL NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  linkedin text,
  email text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviewers_pkey PRIMARY KEY (id),
  CONSTRAINT interviewers_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id)
);

CREATE TABLE public.interviews(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  round integer NOT NULL,
  type interview_type NOT NULL,
  status interview_status NOT NULL DEFAULT 'scheduled'::interview_status,
  scheduled_at timestamp with time zone,
  duration integer,
  location text,
  meeting_url text,
  preparation_notes text,
  questions_asked text[],
  questions_to_ask text[],
  feedback text,
  follow_up_sent boolean DEFAULT FALSE,
  follow_up_date date,
  result interview_result,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$
LANGUAGE 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_applications_user_id ON applications(user_id);

CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_applications_company_name ON applications(company_name);

CREATE INDEX idx_applications_created_at ON applications(created_at);

CREATE INDEX idx_interviews_user_id ON interviews(user_id);

CREATE INDEX idx_interviews_application_id ON interviews(application_id);

CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);

CREATE INDEX idx_companies_user_id ON companies(user_id);

CREATE INDEX idx_companies_name ON companies(name);

CREATE INDEX idx_companies_status ON companies(status);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);

CREATE INDEX idx_documents_user_id ON documents(user_id);

CREATE INDEX idx_documents_application_id ON documents(application_id);

CREATE INDEX idx_documents_type ON documents(type);

CREATE INDEX idx_document_version_links_application_id ON document_version_links(application_id);

CREATE INDEX idx_document_version_links_document_id ON document_version_links(document_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE interviewers ENABLE ROW LEVEL SECURITY;

ALTER TABLE document_version_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view thier user" ON users
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = id);

CREATE POLICY "Users can update their user" ON users
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = id)
      WITH CHECK ((auth.uid()) = id);

CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can create own applications" ON applications
  FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can view own interviews" ON interviews
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can create own interviews" ON interviews
  FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews" ON interviews
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can delete own interviews" ON interviews
  FOR DELETE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can create own companies" ON companies
  FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can create own contacts" ON contacts
  FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can create own documents" ON documents
  FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE
    USING ((
      SELECT
        auth.uid()) = user_id);

CREATE POLICY "Users can view own interviewers" ON interviewers
  FOR SELECT
    USING (EXISTS (
      SELECT
        1
      FROM
        interviews
      WHERE
        interviews.id = interviewers.interview_id AND interviews.user_id = auth.uid()));

CREATE POLICY "Users can manage own interviewers" ON interviewers
  FOR ALL
    USING (EXISTS (
      SELECT
        1
      FROM
        interviews
      WHERE
        interviews.id = interviewers.interview_id AND interviews.user_id = auth.uid()));

CREATE POLICY "Users can view own document version links" ON document_version_links
  FOR SELECT
    USING (EXISTS (
      SELECT
        1
      FROM
        applications
      WHERE
        applications.id = document_version_links.application_id AND applications.user_id = auth.uid()));

CREATE POLICY "Users can manage own document version links" ON document_version_links
  FOR ALL
    USING (EXISTS (
      SELECT
        1
      FROM
        applications
      WHERE
        applications.id = document_version_links.application_id AND applications.user_id = auth.uid()));

