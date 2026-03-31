import { describe, expect, it } from 'vitest';

import { collectOperationBaselines } from '../src/discovery.js';

describe('collectOperationBaselines', () => {
  it('normalizes Google Ads discovery resources into operation ids', () => {
    const discovery = {
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
            },
            googleAds: {
              methods: {
                search: {
                  httpMethod: 'POST',
                  path: 'v22/customers/{+customerId}/googleAds:search'
                }
              }
            }
          }
        }
      }
    };

    expect(collectOperationBaselines(discovery as never)).toEqual([
      {
        httpMethod: 'POST',
        operationId: 'customers.campaigns.mutate',
        path: 'v22/customers/{+customerId}/campaigns:mutate'
      },
      {
        httpMethod: 'POST',
        operationId: 'customers.googleAds.search',
        path: 'v22/customers/{+customerId}/googleAds:search'
      }
    ]);
  });
});
