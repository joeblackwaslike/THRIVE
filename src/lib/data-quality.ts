import type { Company } from '@/types';

export interface DataQualityScore {
  overall: number; // 0-100
  completeness: number; // 0-100
  category: 'poor' | 'fair' | 'good' | 'excellent';
  missingFields: string[];
  suggestions: string[];
}

/**
 * Calculate comprehensive data quality score for a company
 */
export function calculateDataQuality(company: Company): DataQualityScore {
  const missingFields: string[] = [];
  const suggestions: string[] = [];
  let totalFields = 0;
  let filledFields = 0;

  // Essential fields (weighted more heavily)
  const essentialFields = [
    { key: 'name', label: 'Company Name', check: () => !!company.name },
    { key: 'website', label: 'Website', check: () => !!company.website },
    { key: 'industry', label: 'Industry', check: () => !!company.industry?.length },
    { key: 'location', label: 'Location', check: () => !!company.location },
    { key: 'status', label: 'Status', check: () => !!company.status },
  ];

  // Important fields
  const importantFields = [
    { key: 'description', label: 'Description', check: () => !!company.description },
    { key: 'size', label: 'Company Size', check: () => !!company.size },
    { key: 'remotePolicy', label: 'Remote Policy', check: () => !!company.remotePolicy },
    { key: 'priority', label: 'Priority', check: () => !!company.priority },
    { key: 'culture', label: 'Culture Notes', check: () => !!company.culture },
  ];

  // Nice-to-have fields
  const optionalFields = [
    { key: 'techStack', label: 'Tech Stack', check: () => !!company.techStack?.length },
    { key: 'benefits', label: 'Benefits', check: () => !!company.benefits?.length },
    { key: 'salaryRange', label: 'Salary Range', check: () => !!company.salaryRange?.min },
    { key: 'ratings', label: 'Overall Rating', check: () => !!company.ratings?.overall },
    { key: 'pros', label: 'Pros', check: () => !!company.pros?.length },
    { key: 'cons', label: 'Cons', check: () => !!company.cons?.length },
    { key: 'linkedin', label: 'LinkedIn URL', check: () => !!company.companyLinks?.linkedin },
    { key: 'glassdoor', label: 'Glassdoor URL', check: () => !!company.companyLinks?.glassdoor },
  ];

  // Check essential fields (weight: 3x)
  essentialFields.forEach((field) => {
    totalFields += 3;
    if (field.check()) {
      filledFields += 3;
    } else {
      missingFields.push(field.label);
      if (field.key === 'website') {
        suggestions.push('Add company website for easy reference');
      } else if (field.key === 'industry') {
        suggestions.push('Specify industry to better categorize this company');
      } else if (field.key === 'location') {
        suggestions.push('Add location for filtering and organization');
      }
    }
  });

  // Check important fields (weight: 2x)
  importantFields.forEach((field) => {
    totalFields += 2;
    if (field.check()) {
      filledFields += 2;
    } else {
      missingFields.push(field.label);
      if (field.key === 'description') {
        suggestions.push('Add a company description for context');
      } else if (field.key === 'culture') {
        suggestions.push('Document company culture insights');
      }
    }
  });

  // Check optional fields (weight: 1x)
  optionalFields.forEach((field) => {
    totalFields += 1;
    if (field.check()) {
      filledFields += 1;
    } else {
      if (field.key === 'techStack') {
        suggestions.push('List technologies used by the company');
      } else if (field.key === 'salaryRange') {
        suggestions.push('Add salary range for compensation planning');
      } else if (field.key === 'ratings') {
        suggestions.push('Rate the company based on your research');
      }
    }
  });

  const completeness = Math.round((filledFields / totalFields) * 100);

  // Determine category
  let category: DataQualityScore['category'];
  if (completeness >= 80) category = 'excellent';
  else if (completeness >= 60) category = 'good';
  else if (completeness >= 40) category = 'fair';
  else category = 'poor';

  return {
    overall: completeness,
    completeness,
    category,
    missingFields: missingFields.slice(0, 5), // Limit to top 5
    suggestions: suggestions.slice(0, 3), // Limit to top 3
  };
}

/**
 * Get quality badge color based on score
 */
export function getQualityBadgeColor(category: DataQualityScore['category']) {
  switch (category) {
    case 'excellent':
      return 'bg-green-500 text-white';
    case 'good':
      return 'bg-blue-500 text-white';
    case 'fair':
      return 'bg-yellow-500 text-white';
    case 'poor':
      return 'bg-red-500 text-white';
  }
}

/**
 * Get quality badge label
 */
export function getQualityBadgeLabel(category: DataQualityScore['category']) {
  switch (category) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Needs Work';
    case 'poor':
      return 'Incomplete';
  }
}

/**
 * Detect potential duplicate companies by name similarity
 */
export function findPotentialDuplicates(company: Company, allCompanies: Company[]): Company[] {
  const duplicates: Company[] = [];
  const companyName = company.name.toLowerCase().trim();

  allCompanies.forEach((other) => {
    if (other.id === company.id) return;

    const otherName = other.name.toLowerCase().trim();

    // Exact match (different case)
    if (companyName === otherName) {
      duplicates.push(other);
      return;
    }

    // Very similar names (simple fuzzy matching)
    const similarity = calculateSimilarity(companyName, otherName);
    if (similarity > 0.85) {
      duplicates.push(other);
    }

    // Check if one name contains the other (e.g., "Google" and "Google Inc.")
    if (companyName.includes(otherName) || otherName.includes(companyName)) {
      duplicates.push(other);
    }
  });

  return duplicates;
}

/**
 * Simple string similarity calculation (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
