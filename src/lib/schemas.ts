import { z } from 'zod';
import {
  APPLICATION_STATUSES,
  DOCUMENT_TYPES,
  EMPLOYMENT_TYPES,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  PRIORITY_LEVELS,
  WORK_TYPES,
} from '@/lib/constants';

// Salary Range Schema
export const salaryRangeSchema = z
  .object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('USD'),
  })
  .refine((data) => data.max >= data.min, {
    message: 'Maximum salary must be greater than or equal to minimum salary',
  });

// Application Schema
export const applicationSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required').max(200),
  description: z.string().optional(),
  status: z.enum(APPLICATION_STATUSES.map((s) => s.value) as [string, ...string[]]),
  priority: z.enum(PRIORITY_LEVELS.map((p) => p.value) as [string, ...string[]]).default('medium'),
  workType: z.enum(WORK_TYPES.map((w) => w.value) as [string, ...string[]]).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES.map((e) => e.value) as [string, ...string[]]).optional(),
  location: z.string().optional(),
  salary: salaryRangeSchema.optional(),
  jobUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  appliedAt: z.date().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  documentIds: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Company Schema
export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Contact Schema
export const contactSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
  linkedIn: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Interview Schema
export const interviewSchema = z.object({
  id: z.string().optional(),
  applicationId: z.string().min(1, 'Application is required'),
  type: z.enum(INTERVIEW_TYPES.map((t) => t.value) as [string, ...string[]]),
  status: z
    .enum(INTERVIEW_STATUSES.map((s) => s.value) as [string, ...string[]])
    .default('scheduled'),
  scheduledAt: z.date(),
  duration: z.number().min(15).max(480).optional(),
  location: z.string().optional(),
  meetingUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  interviewers: z
    .array(
      z.object({
        name: z.string().min(1, 'Interviewer name is required'),
        role: z.string().optional(),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
      }),
    )
    .default([]),
  notes: z.string().optional(),
  feedback: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Document Schema
export const documentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(DOCUMENT_TYPES.map((d) => d.value) as [string, ...string[]]),
  name: z.string().min(1, 'Document name is required').max(200),
  fileName: z.string().optional(),
  fileSize: z.number().min(0).optional(),
  mimeType: z.string().optional(),
  content: z.string().optional(),
  url: z.string().optional(),
  version: z.number().min(1).default(1),
  applicationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Export types inferred from schemas
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type InterviewInput = z.infer<typeof interviewSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
