/**
 * Application constants and configuration
 */

import type { ApplicationStatus } from '@/types';

/**
 * Application status configuration
 */
export const APPLICATION_STATUSES: {
  value: ApplicationStatus;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 'target',
    label: 'Target',
    description: 'Identified as potential opportunity',
    color: 'gray',
  },
  {
    value: 'hunting',
    label: 'Hunting',
    description: 'Researching and preparing materials',
    color: 'blue',
  },
  {
    value: 'applied',
    label: 'Applied',
    description: 'Application submitted',
    color: 'yellow',
  },
  {
    value: 'interviewing',
    label: 'Interviewing',
    description: 'In interview process',
    color: 'purple',
  },
  {
    value: 'offer',
    label: 'Offer',
    description: 'Received offer, evaluating',
    color: 'green',
  },
  {
    value: 'accepted',
    label: 'Accepted',
    description: 'Offer accepted',
    color: 'emerald',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Not selected',
    color: 'red',
  },
  {
    value: 'withdrawn',
    label: 'Withdrawn',
    description: 'You withdrew',
    color: 'slate',
  },
];

/**
 * Priority levels
 */
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'red' },
] as const;

/**
 * Work types
 */
export const WORK_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
] as const;

/**
 * Employment types
 */
export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
] as const;

/**
 * Company sizes
 */
export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5001+', label: '5001+ employees' },
] as const;

/**
 * Industries
 */
export const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'energy', label: 'Energy' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Document types
 */
export const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume', icon: 'FileText' },
  { value: 'cv', label: 'CV', icon: 'FileText' },
  { value: 'cover-letter', label: 'Cover Letter', icon: 'Mail' },
  { value: 'portfolio', label: 'Portfolio', icon: 'Briefcase' },
  { value: 'transcript', label: 'Transcript', icon: 'GraduationCap' },
  { value: 'certification', label: 'Certification', icon: 'Award' },
  { value: 'other', label: 'Other', icon: 'File' },
] as const;

/**
 * Interview types
 */
export const INTERVIEW_TYPES = [
  { value: 'recruiter-screen', label: 'Recruiter Screen' },
  { value: 'phone-screen', label: 'Phone Screen' },
  { value: 'hiring-manager-chat', label: 'Hiring Manager Chat' },
  { value: 'video', label: 'Video Interview' },
  { value: 'technical-assessment', label: 'Technical Assessment' },
  { value: 'on-site', label: 'On-site Interview' },
  { value: 'technical-interview', label: 'Technical Interview' },
  { value: 'behavioral-interview', label: 'Behavioral Interview' },
  { value: 'leadership-interview', label: 'Leadership Interview' },
  { value: 'panel', label: 'Panel Interview' },
  { value: 'final', label: 'Final Interview' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Interview statuses
 */
export const INTERVIEW_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'no-show', label: 'No Show' },
] as const;

/**
 * Currency options
 */

/**
 * Contact relationship types
 */
export const CONTACT_RELATIONSHIPS = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'hiring-manager', label: 'Hiring Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Currency options
 */
export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'CAD', label: 'CAD ($)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD ($)', symbol: 'A$' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'CHF', label: 'CHF (Fr)', symbol: 'Fr' },
  { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'SGD', label: 'SGD ($)', symbol: 'S$' },
  { value: 'HKD', label: 'HKD ($)', symbol: 'HK$' },
  { value: 'NZD', label: 'NZD ($)', symbol: 'NZ$' },
  { value: 'SEK', label: 'SEK (kr)', symbol: 'kr' },
  { value: 'NOK', label: 'NOK (kr)', symbol: 'kr' },
  { value: 'DKK', label: 'DKK (kr)', symbol: 'kr' },
  { value: 'MXN', label: 'MXN ($)', symbol: 'Mex$' },
] as const;

/**
 * Company statuses for tracking research progress
 */
export const COMPANY_STATUSES = [
  {
    value: 'target',
    label: 'Target',
    description: 'Identified as potential opportunity',
    color: 'gray',
  },
  {
    value: 'researching',
    label: 'Researching',
    description: 'Actively gathering information',
    color: 'blue',
  },
  {
    value: 'applied',
    label: 'Applied',
    description: 'Application submitted to this company',
    color: 'yellow',
  },
  {
    value: 'interviewing',
    label: 'Interviewing',
    description: 'In interview process',
    color: 'purple',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Not selected or passed',
    color: 'red',
  },
  {
    value: 'not-interested',
    label: 'Not Interested',
    description: 'Not pursuing opportunities here',
    color: 'slate',
  },
] as const;

/**
 * Remote work policies
 */
export const REMOTE_POLICIES = [
  { value: 'full-remote', label: 'Full Remote', icon: '🌍' },
  { value: 'hybrid', label: 'Hybrid', icon: '🏢' },
  { value: 'on-site', label: 'On-Site', icon: '🏛️' },
  { value: 'flexible', label: 'Flexible', icon: '🔄' },
] as const;

/**
 * Interview difficulty levels
 */
export const INTERVIEW_DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'hard', label: 'Hard', color: 'text-red-600' },
] as const;

/**
 * Interview experience ratings
 */
export const INTERVIEW_EXPERIENCES = [
  { value: 'positive', label: 'Positive', color: 'bg-green-500', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-500', emoji: '😐' },
  { value: 'negative', label: 'Negative', color: 'bg-red-500', emoji: '😞' },
] as const;

/**
 * Company rating categories
 */
export const COMPANY_RATING_CATEGORIES = [
  { key: 'overall', label: 'Overall', description: 'Overall company rating' },
  {
    key: 'workLifeBalance',
    label: 'Work-Life Balance',
    description: 'Balance between work and personal life',
  },
  { key: 'compensation', label: 'Compensation', description: 'Salary and benefits package' },
  { key: 'careerGrowth', label: 'Career Growth', description: 'Opportunities for advancement' },
  { key: 'management', label: 'Management', description: 'Quality of leadership and management' },
  { key: 'culture', label: 'Culture', description: 'Company culture and values' },
] as const;

/**
 * Application sources
 */
export const APPLICATION_SOURCES = [
  'LinkedIn',
  'Indeed',
  'Company Website',
  'Referral',
  'Recruiter',
  'Job Board',
  'Networking Event',
  'Other',
] as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  APPLICATIONS: 'thrive_applications',
  DOCUMENTS: 'thrive_documents',
  COMPANIES: 'thrive_companies',
  PREFERENCES: 'thrive_preferences',
  THEME: 'thrive_theme',
} as const;

/**
 * Application metadata
 */
export const APP_CONFIG = {
  name: 'THRIVE',
  version: '0.0.1',
  description: 'Job Application Tracker',
  author: 'Your Name',
  github: 'https://github.com/adriandarian/thrive',
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
