// lib/semanticSearch.ts
// Client-side TF-IDF semantic ranking — finds most relevant files for a query

import { IndexedFile } from '@/types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
  'how', 'what', 'where', 'does', 'do', 'with', 'this', 'that', 'it', 'be',
  'are', 'was', 'were', 'has', 'have', 'can', 'could', 'would', 'should',
  'me', 'my', 'about', 'from', 'which', 'work', 'works', 'get', 'use',
]);

// Split text into meaningful tokens (handles camelCase, snake_case, kebab-case, paths)
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2')         // camelCase → camel Case
    .split(/[^a-z0-9]+/)                           // split on non-alphanumeric
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// Score a single file against query tokens
function scoreFile(file: IndexedFile, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;

  const pathTokens = tokenize(file.path);
  const nameTokens = tokenize(file.name);
  let score = 0;

  for (const qt of queryTokens) {
    // File name matches (highest weight — directly named file is most relevant)
    if (nameTokens.includes(qt)) score += 5;
    else if (nameTokens.some((nt) => nt.includes(qt) || qt.includes(nt))) score += 2;

    // Path matches (medium weight)
    if (pathTokens.includes(qt)) score += 3;
    else if (pathTokens.some((pt) => pt.includes(qt) || qt.includes(pt))) score += 1;
  }

  // Bonus: prefer files closer to root (shorter paths = more central)
  const depth = (file.path.match(/\//g) ?? []).length;
  if (score > 0) score += Math.max(0, 3 - depth);

  return score;
}

// Return top N files ranked by relevance to the query
export function rankFilesByQuery(
  files: IndexedFile[],
  query: string,
  topN = 20
): IndexedFile[] {
  if (files.length <= topN) return files;

  const queryTokens = tokenize(query);

  // If query has no meaningful tokens, return evenly spread sample
  if (queryTokens.length === 0) return files.slice(0, topN);

  const scored = files
    .map((file) => ({ file, score: scoreFile(file, queryTokens) }))
    .sort((a, b) => b.score - a.score);

  // Always include at least some zero-score files for broad context
  const relevant = scored.filter((s) => s.score > 0).slice(0, topN);
  const fallback = scored.filter((s) => s.score === 0).slice(0, topN - relevant.length);

  return [...relevant, ...fallback].map((s) => s.file);
}
