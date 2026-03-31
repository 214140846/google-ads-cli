import { describe, expect, it } from 'vitest';

import {
  collectDocsCatalogEntries,
  computeCoverageThreshold
} from '../src/catalog.js';

describe('collectDocsCatalogEntries', () => {
  it('extracts unique Google Ads docs urls and derives topics', () => {
    const html = `
      <a href="/google-ads/api/docs/campaigns/overview">Campaigns</a>
      <a href="/google-ads/api/docs/campaigns/create-campaigns">Create</a>
      <a href="/google-ads/api/docs/conversions/overview">Conversions</a>
      <a href="/google-ads/api/docs/campaigns/overview">Campaigns</a>
    `;

    expect(collectDocsCatalogEntries(html)).toEqual([
      {
        path: '/google-ads/api/docs/campaigns/create-campaigns',
        topic: 'campaigns',
        url: 'https://developers.google.com/google-ads/api/docs/campaigns/create-campaigns'
      },
      {
        path: '/google-ads/api/docs/campaigns/overview',
        topic: 'campaigns',
        url: 'https://developers.google.com/google-ads/api/docs/campaigns/overview'
      },
      {
        path: '/google-ads/api/docs/conversions/overview',
        topic: 'conversions',
        url: 'https://developers.google.com/google-ads/api/docs/conversions/overview'
      }
    ]);
  });
});

describe('computeCoverageThreshold', () => {
  it('rounds up the required count for ninety percent coverage', () => {
    expect(
      computeCoverageThreshold([
        { operationId: 'a', httpMethod: 'GET', path: 'x' },
        { operationId: 'b', httpMethod: 'GET', path: 'x' },
        { operationId: 'c', httpMethod: 'GET', path: 'x' },
        { operationId: 'd', httpMethod: 'GET', path: 'x' },
        { operationId: 'e', httpMethod: 'GET', path: 'x' },
        { operationId: 'f', httpMethod: 'GET', path: 'x' },
        { operationId: 'g', httpMethod: 'GET', path: 'x' },
        { operationId: 'h', httpMethod: 'GET', path: 'x' },
        { operationId: 'i', httpMethod: 'GET', path: 'x' }
      ])
    ).toEqual({
      coveredCountRequired: 9,
      totalCount: 9
    });
  });
});
