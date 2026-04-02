import { describe, expect, it } from 'vitest';

import { generateShortcutEntries } from '../src/shortcuts.js';

describe('generateShortcutEntries', () => {
  it('maps a customers mutate operation to a shortcut entry', () => {
    expect(
      generateShortcutEntries([
        {
          httpMethod: 'POST',
          operationId: 'customers.campaigns.mutate',
          path: 'v22/customers/{+customerId}/campaigns:mutate'
        }
      ])
    ).toEqual([
      {
        commandPath: ['customers', 'campaigns', 'mutate'],
        httpMethod: 'POST',
        operationId: 'customers.campaigns.mutate',
        path: 'v22/customers/{+customerId}/campaigns:mutate',
        pathParams: ['customerId']
      }
    ]);
  });

  it('keeps root level operations as a two segment command path', () => {
    expect(
      generateShortcutEntries([
        {
          httpMethod: 'POST',
          operationId: 'audienceInsights.listInsightsEligibleDates',
          path: 'v22/audienceInsights:listInsightsEligibleDates'
        }
      ])
    ).toEqual([
      {
        commandPath: ['audienceInsights', 'listInsightsEligibleDates'],
        httpMethod: 'POST',
        operationId: 'audienceInsights.listInsightsEligibleDates',
        path: 'v22/audienceInsights:listInsightsEligibleDates',
        pathParams: []
      }
    ]);
  });

  it('extracts resourceName path params for get operations', () => {
    expect(
      generateShortcutEntries([
        {
          httpMethod: 'GET',
          operationId: 'googleAdsFields.get',
          path: 'v22/{+resourceName}'
        }
      ])
    ).toEqual([
      {
        commandPath: ['googleAdsFields', 'get'],
        httpMethod: 'GET',
        operationId: 'googleAdsFields.get',
        path: 'v22/{+resourceName}',
        pathParams: ['resourceName']
      }
    ]);
  });

  it('retains googleAdsFields search command segments', () => {
    expect(
      generateShortcutEntries([
        {
          httpMethod: 'POST',
          operationId: 'googleAdsFields.search',
          path: 'v22/googleAdsFields:search'
        }
      ])
    ).toEqual([
      {
        commandPath: ['googleAdsFields', 'search'],
        httpMethod: 'POST',
        operationId: 'googleAdsFields.search',
        path: 'v22/googleAdsFields:search',
        pathParams: []
      }
    ]);
  });
});
