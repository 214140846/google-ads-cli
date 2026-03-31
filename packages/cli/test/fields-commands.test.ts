import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads fields search', () => {
  it('builds a dry-run request against googleAdsFields.search', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      [
        'fields',
        'search',
        '--catalog',
        'generated/google-ads/v22/operations.json',
        '--access-token',
        'token-123',
        '--developer-token',
        'dev-456',
        '--query',
        "SELECT name WHERE name LIKE 'campaign.%'",
        '--dry-run'
      ],
      {
        loadOperationsCatalog: async () => [
          {
            httpMethod: 'POST',
            operationId: 'googleAdsFields.search',
            path: 'v22/googleAdsFields:search'
          }
        ],
        stdout: {
          write: (value: string) => {
            chunks.push(value);
            return true;
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(chunks.join(''))).toEqual({
      operationId: 'googleAdsFields.search',
      url: 'https://googleads.googleapis.com/v22/googleAdsFields:search',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
          'content-type': 'application/json',
          'developer-token': 'dev-456'
        },
        body: JSON.stringify({
          query: "SELECT name WHERE name LIKE 'campaign.%'"
        })
      }
    });
  });
});

describe('gads fields get', () => {
  it('builds a dry-run request against googleAdsFields.get', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      [
        'fields',
        'get',
        'googleAdsFields/campaign.id',
        '--catalog',
        'generated/google-ads/v22/operations.json',
        '--access-token',
        'token-123',
        '--developer-token',
        'dev-456',
        '--dry-run'
      ],
      {
        loadOperationsCatalog: async () => [
          {
            httpMethod: 'GET',
            operationId: 'googleAdsFields.get',
            path: 'v22/{+resourceName}'
          }
        ],
        stdout: {
          write: (value: string) => {
            chunks.push(value);
            return true;
          }
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(chunks.join(''))).toEqual({
      operationId: 'googleAdsFields.get',
      url: 'https://googleads.googleapis.com/v22/googleAdsFields%2Fcampaign.id',
      init: {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token-123',
          'developer-token': 'dev-456'
        }
      }
    });
  });
});
