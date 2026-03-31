import { describe, expect, it } from 'vitest';

import { syncGoogleAdsCatalog } from '../src/sync.js';

describe('syncGoogleAdsCatalog', () => {
  it('collects operations, docs entries, and a ninety percent threshold', async () => {
    const responses = new Map<string, string>([
      [
        'https://googleads.googleapis.com/$discovery/rest?version=v22',
        JSON.stringify({
          resources: {
            customers: {
              resources: {
                campaigns: {
                  methods: {
                    mutate: {
                      httpMethod: 'POST',
                      path: 'v22/customers/{+customerId}/campaigns:mutate'
                    }
                  }
                }
              }
            }
          }
        })
      ],
      [
        'https://developers.google.com/google-ads/api/docs/start',
        `
          <a href="/google-ads/api/docs/campaigns/overview">Campaigns</a>
          <a href="/google-ads/api/docs/conversions/overview">Conversions</a>
        `
      ]
    ]);

    const result = await syncGoogleAdsCatalog({
      fetchText: async (url) => {
        const value = responses.get(url);

        if (!value) {
          throw new Error(`Unexpected URL: ${url}`);
        }

        return value;
      },
      version: 'v22'
    });

    expect(result).toEqual({
      coverage: {
        coveredCountRequired: 1,
        totalCount: 1
      },
      docsEntries: [
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
      ],
      operations: [
        {
          httpMethod: 'POST',
          operationId: 'customers.campaigns.mutate',
          path: 'v22/customers/{+customerId}/campaigns:mutate'
        }
      ],
      version: 'v22'
    });
  });
});
