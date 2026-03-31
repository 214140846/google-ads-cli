import {
  collectDocsCatalogEntries,
  computeCoverageThreshold,
  type CoverageThreshold,
  type DocsCatalogEntry
} from './catalog.js';
import {
  collectOperationBaselines,
  type DiscoveryDocument,
  type OperationBaseline
} from './discovery.js';

const DISCOVERY_URL = 'https://googleads.googleapis.com/$discovery/rest?version=';
const DOCS_START_URL = 'https://developers.google.com/google-ads/api/docs/start';

export interface SyncGoogleAdsCatalogOptions {
  version: string;
  fetchText?: (url: string) => Promise<string>;
}

export interface SyncedGoogleAdsCatalog {
  version: string;
  operations: OperationBaseline[];
  docsEntries: DocsCatalogEntry[];
  coverage: CoverageThreshold;
}

async function fetchTextViaHttp(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

export async function syncGoogleAdsCatalog(
  options: SyncGoogleAdsCatalogOptions
): Promise<SyncedGoogleAdsCatalog> {
  const fetchText = options.fetchText ?? fetchTextViaHttp;
  const [discoveryText, docsHtml] = await Promise.all([
    fetchText(`${DISCOVERY_URL}${options.version}`),
    fetchText(DOCS_START_URL)
  ]);

  const operations = collectOperationBaselines(
    JSON.parse(discoveryText) as DiscoveryDocument
  );
  const docsEntries = collectDocsCatalogEntries(docsHtml);

  return {
    version: options.version,
    operations,
    docsEntries,
    coverage: computeCoverageThreshold(operations)
  };
}
