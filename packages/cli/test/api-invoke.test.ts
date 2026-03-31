import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads api invoke', () => {
  it('prints a dry-run request for an operation id', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      [
        'api',
        'invoke',
        'customers.campaigns.mutate',
        '--catalog',
        'generated/google-ads/v22/operations.json',
        '--access-token',
        'token-123',
        '--developer-token',
        'dev-456',
        '--customer-id',
        '5554443333',
        '--dry-run'
      ],
      {
        loadOperationsCatalog: async () => [
          {
            httpMethod: 'POST',
            operationId: 'customers.campaigns.mutate',
            path: 'v22/customers/{+customerId}/campaigns:mutate'
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
      init: {
        headers: {
          Authorization: 'Bearer token-123',
          'developer-token': 'dev-456'
        },
        method: 'POST'
      },
      operationId: 'customers.campaigns.mutate',
      url: 'https://googleads.googleapis.com/v22/customers/5554443333/campaigns:mutate'
    });
  });
});
