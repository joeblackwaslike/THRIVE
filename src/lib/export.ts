import { format } from 'date-fns';
import type { Application, Company, Document, Interview } from '@/types';

/**
 * Export utilities for CSV, JSON, and backup/restore functionality
 */

/**
 * Convert applications to CSV format
 */
export function exportApplicationsToCSV(applications: Application[]): string {
  if (applications.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Company Name',
    'Position',
    'Status',
    'Priority',
    'Target Date',
    'Applied Date',
    'First Interview Date',
    'Offer Date',
    'Response Deadline',
    'Location',
    'Work Type',
    'Employment Type',
    'Salary Min',
    'Salary Max',
    'Job URL',
    'Job Description',
    'Notes',
    'Tags',
    'Source',
    'Referral Name',
    'Created At',
    'Updated At',
  ];

  // Helper to escape CSV values
  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // Escape double quotes and wrap in quotes if contains comma, newline, or quote
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV rows
  const rows = applications.map((app) => [
    escapeCSVValue(app.id),
    escapeCSVValue(app.companyName),
    escapeCSVValue(app.position),
    escapeCSVValue(app.status),
    escapeCSVValue(app.priority || ''),
    escapeCSVValue(app.targetDate || ''),
    escapeCSVValue(app.appliedDate || ''),
    escapeCSVValue(app.firstInterviewDate || ''),
    escapeCSVValue(app.offerDate || ''),
    escapeCSVValue(app.responseDeadline || ''),
    escapeCSVValue(app.location || ''),
    escapeCSVValue(app.workType || ''),
    escapeCSVValue(app.employmentType || ''),
    escapeCSVValue(app.salary?.min || ''),
    escapeCSVValue(app.salary?.max || ''),
    escapeCSVValue(app.jobUrl || ''),
    escapeCSVValue(app.jobDescription || ''),
    escapeCSVValue(app.notes || ''),
    escapeCSVValue(app.tags?.join('; ') || ''),
    escapeCSVValue(app.source || ''),
    escapeCSVValue(app.referralName || ''),
    escapeCSVValue(app.createdAt),
    escapeCSVValue(app.updatedAt),
  ]);

  // Combine headers and rows
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export applications to CSV and trigger download
 */
export function exportAndDownloadApplicationsCSV(applications: Application[]): void {
  const csvContent = exportApplicationsToCSV(applications);

  if (!csvContent) {
    console.warn('No applications to export');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `thrive-applications-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Convert data to JSON format for export
 */
export function exportToJSON<T>(data: T, pretty = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Download JSON file
 */
export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export applications to JSON and trigger download
 */
export function exportAndDownloadApplicationsJSON(applications: Application[]): void {
  const jsonContent = exportToJSON(applications);

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `thrive-applications-${timestamp}.json`;

  downloadJSON(jsonContent, filename);
}

// ============ Interviews Export ============

/**
 * Convert interviews to CSV format
 */
export function exportInterviewsToCSV(
  interviews: Interview[],
  applications: Application[],
): string {
  if (interviews.length === 0) {
    return '';
  }

  const headers = [
    'ID',
    'Company',
    'Position',
    'Interview Type',
    'Status',
    'Scheduled Date',
    'Duration (min)',
    'Location/Link',
    'Interviewer',
    'Round',
    'Preparation Notes',
    'Feedback',
    'Next Steps',
    'Created At',
    'Updated At',
  ];

  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = interviews.map((interview) => {
    const app = applications.find((a) => a.id === interview.applicationId);
    const interviewerNames = interview.interviewers?.map((i) => i.name).join(', ') || '';
    return [
      escapeCSVValue(interview.id),
      escapeCSVValue(app?.companyName || ''),
      escapeCSVValue(app?.position || ''),
      escapeCSVValue(interview.type),
      escapeCSVValue(interview.status),
      escapeCSVValue(
        interview.scheduledAt ? format(new Date(interview.scheduledAt), 'yyyy-MM-dd HH:mm') : '',
      ),
      escapeCSVValue(interview.duration || ''),
      escapeCSVValue(interview.location || ''),
      escapeCSVValue(interviewerNames),
      escapeCSVValue(interview.round || ''),
      escapeCSVValue(interview.preparationNotes || ''),
      escapeCSVValue(interview.feedback || ''),
      escapeCSVValue(''), // next steps field doesn't exist, leaving blank
      escapeCSVValue(interview.createdAt),
      escapeCSVValue(interview.updatedAt),
    ];
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Export interviews to CSV and trigger download
 */
export function exportAndDownloadInterviewsCSV(
  interviews: Interview[],
  applications: Application[],
): void {
  const csvContent = exportInterviewsToCSV(interviews, applications);

  if (!csvContent) {
    console.warn('No interviews to export');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `thrive-interviews-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Export interviews to JSON and trigger download
 */
export function exportAndDownloadInterviewsJSON(interviews: Interview[]): void {
  const jsonContent = exportToJSON(interviews);

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `thrive-interviews-${timestamp}.json`;

  downloadJSON(jsonContent, filename);
}

// ============ Documents Export ============

/**
 * Convert documents to CSV format
 */
export function exportDocumentsToCSV(documents: Document[]): string {
  if (documents.length === 0) {
    return '';
  }

  const headers = [
    'ID',
    'Name',
    'Type',
    'Version',
    'File Size (KB)',
    'Upload Date',
    'Application ID',
    'Description',
    'Tags',
  ];

  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = documents.map((doc) => [
    escapeCSVValue(doc.id),
    escapeCSVValue(doc.name),
    escapeCSVValue(doc.type),
    escapeCSVValue(doc.version || ''),
    escapeCSVValue(doc.fileSize ? Math.round(doc.fileSize / 1024) : ''),
    escapeCSVValue(doc.lastUsedDate ? format(new Date(doc.lastUsedDate), 'yyyy-MM-dd') : ''),
    escapeCSVValue(doc.applicationId || ''),
    escapeCSVValue(doc.content || ''),
    escapeCSVValue(doc.tags?.join('; ') || ''),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Export documents to CSV and trigger download
 */
export function exportAndDownloadDocumentsCSV(documents: Document[]): void {
  const csvContent = exportDocumentsToCSV(documents);

  if (!csvContent) {
    console.warn('No documents to export');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `thrive-documents-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Export documents to JSON and trigger download
 */
export function exportAndDownloadDocumentsJSON(documents: Document[]): void {
  const jsonContent = exportToJSON(documents);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `thrive-documents-${timestamp}.json`;

  downloadJSON(jsonContent, filename);
}

/**
 * Export documents as ZIP file with metadata and actual document files
 * Note: This is a placeholder for future implementation with JSZip
 */
export async function exportAndDownloadDocumentsZIP(documents: Document[]): Promise<void> {
  // Check if JSZip is available
  if (typeof window === 'undefined') {
    console.error('ZIP export is only available in browser environment');
    return;
  }

  try {
    // Dynamic import of JSZip (you'll need to install it: bun add jszip)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add metadata JSON
    const metadata = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      version: doc.version,
      versionName: doc.versionName,
      baseDocumentId: doc.baseDocumentId,
      applicationId: doc.applicationId,
      usedInApplicationIds: doc.usedInApplicationIds,
      lastUsedDate: doc.lastUsedDate,
      tags: doc.tags,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // Create a documents folder in the ZIP
    const docsFolder = zip.folder('documents');

    if (!docsFolder) {
      throw new Error('Failed to create documents folder in ZIP');
    }

    // Add each document file
    for (const doc of documents) {
      try {
        let fileContent: Blob | string | null = null;
        const safeFileName = doc.fileName || `${doc.name.replace(/[^a-z0-9]/gi, '_')}.txt`;

        // Try to get the file content from various sources
        if (doc.fileUrl) {
          // If it's a data URL, convert it to blob
          if (doc.fileUrl.startsWith('data:')) {
            const response = await fetch(doc.fileUrl);
            fileContent = await response.blob();
          } else if (doc.fileUrl.startsWith('blob:')) {
            // If it's a blob URL, fetch it
            const response = await fetch(doc.fileUrl);
            fileContent = await response.blob();
          } else {
            // If it's a regular URL, try to fetch it (may fail due to CORS)
            try {
              const response = await fetch(doc.fileUrl);
              fileContent = await response.blob();
            } catch (error) {
              console.warn(`Failed to fetch document from URL: ${doc.fileUrl}`, error);
              // Create a text file with the URL instead
              fileContent = `Document URL: ${doc.fileUrl}\n\nNote: The actual file could not be included in the export. Please download it manually from the URL above.`;
            }
          }
        } else if (doc.content) {
          // If we have text content, use that
          fileContent = doc.content;
        } else if (doc.url) {
          // Try alternative URL field
          try {
            const response = await fetch(doc.url);
            fileContent = await response.blob();
          } catch (error) {
            console.warn(`Failed to fetch document from URL: ${doc.url}`, error);
            fileContent = `Document URL: ${doc.url}\n\nNote: The actual file could not be included in the export. Please download it manually from the URL above.`;
          }
        }

        if (fileContent) {
          docsFolder.file(safeFileName, fileContent);
        } else {
          // Create a placeholder file
          docsFolder.file(
            `${safeFileName}.txt`,
            `Document: ${doc.name}\nType: ${doc.type}\n\nNote: The actual file content was not available for export.`,
          );
        }
      } catch (error) {
        console.error(`Failed to add document ${doc.name} to ZIP:`, error);
        // Add error note file
        docsFolder.file(
          `ERROR_${doc.name}.txt`,
          `Failed to export document: ${doc.name}\nError: ${error}`,
        );
      }
    }

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Download the ZIP
    const link = document.createElement('a');
    const url = URL.createObjectURL(zipBlob);
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `thrive-documents-${timestamp}.zip`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to create ZIP export:', error);
    throw error;
  }
}

// ============ Companies Export ============

/**
 * Convert companies to CSV format
 */
export function exportCompaniesToCSV(companies: Company[]): string {
  if (companies.length === 0) {
    return '';
  }

  const headers = [
    'ID',
    'Name',
    'Website',
    'Industry',
    'Size',
    'Location',
    'Founded',
    'Remote Policy',
    'Status',
    'Priority',
    'Researched',
    'Description',
    'Culture Notes',
    'Tech Stack',
    'Benefits',
    'Pros',
    'Cons',
    'Notes',
    'Overall Rating',
    'Work-Life Balance',
    'Compensation Rating',
    'Career Growth',
    'Management Rating',
    'Culture Rating',
    'Interview Difficulty',
    'Interview Experience',
    'Salary Min',
    'Salary Max',
    'Currency',
    'Tags',
    'Application IDs',
    'Contact IDs',
    'Document IDs',
    'Interview IDs',
    'Created At',
    'Updated At',
  ];

  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = companies.map((company) => [
    escapeCSVValue(company.id),
    escapeCSVValue(company.name),
    escapeCSVValue(company.website || ''),
    escapeCSVValue(company.industry?.join('; ') || ''),
    escapeCSVValue(company.size || ''),
    escapeCSVValue(company.location || ''),
    escapeCSVValue(company.founded || ''),
    escapeCSVValue(company.remotePolicy || ''),
    escapeCSVValue(company.status || ''),
    escapeCSVValue(company.priority || ''),
    escapeCSVValue(company.researched ? 'Yes' : 'No'),
    escapeCSVValue(company.description || ''),
    escapeCSVValue(company.cultureNotes || ''),
    escapeCSVValue(company.techStack?.join('; ') || ''),
    escapeCSVValue(company.benefits?.join('; ') || ''),
    escapeCSVValue(company.pros?.join('; ') || ''),
    escapeCSVValue(company.cons?.join('; ') || ''),
    escapeCSVValue(company.notes || ''),
    escapeCSVValue(company.ratings?.overall || ''),
    escapeCSVValue(company.ratings?.workLifeBalance || ''),
    escapeCSVValue(company.ratings?.compensation || ''),
    escapeCSVValue(company.ratings?.careerGrowth || ''),
    escapeCSVValue(company.ratings?.management || ''),
    escapeCSVValue(company.ratings?.culture || ''),
    escapeCSVValue(company.interviewDifficulty || ''),
    escapeCSVValue(company.interviewExperience || ''),
    escapeCSVValue(company.salaryRange?.min || ''),
    escapeCSVValue(company.salaryRange?.max || ''),
    escapeCSVValue(company.salaryRange?.currency || ''),
    escapeCSVValue(company.tags?.join('; ') || ''),
    escapeCSVValue(company.applicationIds?.join('; ') || ''),
    escapeCSVValue(company.contactIds?.join('; ') || ''),
    escapeCSVValue(company.documentIds?.join('; ') || ''),
    escapeCSVValue(company.interviewIds?.join('; ') || ''),
    escapeCSVValue(company.createdAt),
    escapeCSVValue(company.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Export companies to CSV and trigger download
 */
export function exportAndDownloadCompaniesCSV(companies: Company[]): void {
  const csvContent = exportCompaniesToCSV(companies);

  if (!csvContent) {
    console.warn('No companies to export');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `thrive-companies-${timestamp}.csv`;

  downloadCSV(csvContent, filename);
}

/**
 * Export companies to JSON and trigger download
 */
export function exportAndDownloadCompaniesJSON(companies: Company[]): void {
  const jsonContent = exportToJSON(companies);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `thrive-companies-${timestamp}.json`;

  downloadJSON(jsonContent, filename);
}

// ============ Backup & Restore ============

export interface BackupData {
  version: string;
  exportDate: string;
  applications: Application[];
  interviews: Interview[];
  documents: Document[];
  metadata: {
    totalApplications: number;
    totalInterviews: number;
    totalDocuments: number;
  };
}

/**
 * Create a full backup of all data
 */
export function createBackup(
  applications: Application[],
  interviews: Interview[],
  documents: Document[],
): BackupData {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    applications,
    interviews,
    documents,
    metadata: {
      totalApplications: applications.length,
      totalInterviews: interviews.length,
      totalDocuments: documents.length,
    },
  };
}

/**
 * Export full backup and trigger download
 */
export function exportBackup(
  applications: Application[],
  interviews: Interview[],
  documents: Document[],
): void {
  const backup = createBackup(applications, interviews, documents);
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = `thrive-backup-${timestamp}.json`;

  const jsonContent = exportToJSON(backup);
  downloadJSON(jsonContent, filename);
}

/**
 * Parse and validate backup file
 */
export function parseBackupFile(jsonString: string): BackupData {
  try {
    const data = JSON.parse(jsonString);

    // Basic validation
    if (!data.version || !data.applications || !data.interviews) {
      throw new Error('Invalid backup file format');
    }

    return data as BackupData;
  } catch (error) {
    throw new Error(`Failed to parse backup file: ${error}`);
  }
}

/**
 * Validate backup data integrity
 */
export function validateBackupData(data: BackupData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.version) {
    errors.push('Missing version information');
  }

  if (!Array.isArray(data.applications)) {
    errors.push('Invalid applications data');
  }

  if (!Array.isArray(data.interviews)) {
    errors.push('Invalid interviews data');
  }

  if (!Array.isArray(data.documents)) {
    errors.push('Invalid documents data');
  }

  // Check if metadata matches actual data
  if (data.metadata) {
    if (data.metadata.totalApplications !== data.applications.length) {
      errors.push('Application count mismatch');
    }
    if (data.metadata.totalInterviews !== data.interviews.length) {
      errors.push('Interview count mismatch');
    }
    if (data.metadata.totalDocuments !== data.documents.length) {
      errors.push('Document count mismatch');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============ Date Range Filtering ============

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Filter applications by date range
 */
export function filterApplicationsByDateRange(
  applications: Application[],
  filter: DateRangeFilter,
): Application[] {
  return applications.filter((app) => {
    if (!app.appliedDate) return false;
    const appliedDate = new Date(app.appliedDate);

    if (filter.startDate && appliedDate < filter.startDate) return false;
    if (filter.endDate && appliedDate > filter.endDate) return false;

    return true;
  });
}

/**
 * Filter interviews by date range
 */
export function filterInterviewsByDateRange(
  interviews: Interview[],
  filter: DateRangeFilter,
): Interview[] {
  return interviews.filter((interview) => {
    if (!interview.scheduledAt) return false;
    const scheduledDate = new Date(interview.scheduledAt);

    if (filter.startDate && scheduledDate < filter.startDate) return false;
    if (filter.endDate && scheduledDate > filter.endDate) return false;

    return true;
  });
}

// ============ Custom Report Builder ============

export type ReportField = {
  key: string;
  label: string;
  selected: boolean;
};

export type ReportFilter = {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: string | number | Date;
};

export interface CustomReportConfig {
  title: string;
  dataSource: 'applications' | 'interviews' | 'documents';
  fields: ReportField[];
  filters: ReportFilter[];
  dateRange?: DateRangeFilter;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generate custom report based on configuration
 */
export function generateCustomReport(
  config: CustomReportConfig,
  data: Application[] | Interview[] | Document[],
): unknown[] {
  let filteredData = [...data];

  // Apply filters
  config.filters.forEach((filter) => {
    filteredData = filteredData.filter((item) => {
      const value = (item as unknown as Record<string, unknown>)[filter.field];

      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater':
          return Number(value) > Number(filter.value);
        case 'less':
          return Number(value) < Number(filter.value);
        default:
          return true;
      }
    });
  });

  // Apply sorting
  if (config.sortBy) {
    filteredData.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[config.sortBy as string];
      const bValue = (b as unknown as Record<string, unknown>)[config.sortBy as string];

      // Handle unknown types safely
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return config.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // Select only requested fields
  const selectedFields = config.fields.filter((f) => f.selected).map((f) => f.key);
  return filteredData.map((item) => {
    const filtered: Record<string, unknown> = {};
    selectedFields.forEach((key) => {
      filtered[key] = (item as unknown as Record<string, unknown>)[key];
    });
    return filtered;
  });
}

/**
 * Export custom report as CSV
 */
export function exportCustomReportToCSV(config: CustomReportConfig, data: unknown[]): string {
  if (data.length === 0) {
    return '';
  }

  const selectedFields = config.fields.filter((f) => f.selected);
  const headers = selectedFields.map((f) => f.label);

  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const rows = data.map((item) =>
    selectedFields.map((field) => escapeCSVValue((item as Record<string, unknown>)[field.key])),
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
