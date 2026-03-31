import type { OperationBaseline } from './discovery.js';

const DOCS_BASE_URL = 'https://developers.google.com';
const DOCS_PATH_PATTERN = /\/google-ads\/api\/docs\/[^"]+/g;

export interface DocsCatalogEntry {
  path: string;
  topic: string;
  url: string;
}

export interface CoverageThreshold {
  totalCount: number;
  coveredCountRequired: number;
}

export function collectDocsCatalogEntries(html: string): DocsCatalogEntry[] {
  const paths = new Set(html.match(DOCS_PATH_PATTERN) ?? []);

  return [...paths]
    .sort((left, right) => left.localeCompare(right))
    .map((path) => ({
      path,
      topic: path.split('/')[4] ?? 'unknown',
      url: `${DOCS_BASE_URL}${path}`
    }));
}

export function computeCoverageThreshold(
  operations: OperationBaseline[]
): CoverageThreshold {
  const totalCount = operations.length;

  return {
    totalCount,
    coveredCountRequired: Math.ceil(totalCount * 0.9)
  };
}
