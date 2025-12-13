/**
 * Fuzzy search utility with typo tolerance
 */

/**
 * Calculate Levenshtein distance between two strings
 * (number of single-character edits needed to change one string into another)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Fuzzy match search - returns true if query fuzzy matches text
 */
export function fuzzyMatch(text: string, query: string, threshold = 0.6): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) return true;

  // Check if query matches as subsequence
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  if (queryIndex === queryLower.length) return true;

  // Fuzzy match with similarity threshold
  const words = textLower.split(/\s+/);
  for (const word of words) {
    if (similarityScore(word, queryLower) >= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Highlight matching parts of text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract search terms from query (handles quotes, AND/OR)
 */
export function parseSearchQuery(query: string): {
  terms: string[];
  exactPhrases: string[];
  operators: { and: boolean; or: boolean };
} {
  const exactPhrases: string[] = [];
  const terms: string[] = [];
  let hasAnd = false;
  let hasOr = false;

  // Extract quoted phrases
  const quotedRegex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex exec pattern
  while ((match = quotedRegex.exec(query)) !== null) {
    exactPhrases.push(match[1]);
  }

  // Remove quoted phrases from query
  const withoutQuotes = query.replace(quotedRegex, '');

  // Check for AND/OR operators
  hasAnd = /\bAND\b/i.test(withoutQuotes);
  hasOr = /\bOR\b/i.test(withoutQuotes);

  // Extract remaining terms
  const words = withoutQuotes
    .replace(/\b(AND|OR)\b/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  terms.push(...words);

  return {
    terms,
    exactPhrases,
    operators: { and: hasAnd, or: hasOr },
  };
}

/**
 * Score a text against a search query (higher = better match)
 */
export function scoreMatch(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match scores highest
  if (textLower === queryLower) return 100;

  // Starts with query
  if (textLower.startsWith(queryLower)) return 90;

  // Contains query
  if (textLower.includes(queryLower)) return 80;

  // Word boundary match
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}`, 'i');
  if (wordBoundaryRegex.test(textLower)) return 70;

  // Fuzzy match score
  const words = textLower.split(/\s+/);
  let bestScore = 0;
  for (const word of words) {
    const score = similarityScore(word, queryLower);
    if (score > bestScore) bestScore = score;
  }

  return bestScore * 60; // Max 60 points for fuzzy match
}
