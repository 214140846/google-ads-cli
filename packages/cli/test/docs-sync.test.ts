import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads docs sync', () => {
  it('writes operations and docs catalog json files', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'gads-cli-'));

    const exitCode = await runCli(
      ['docs', 'sync', '--version', 'v22', '--out-dir', outDir],
      {
        syncCatalog: async () => ({
          coverage: {
            coveredCountRequired: 1,
            totalCount: 1
          },
          docsEntries: [
            {
              path: '/google-ads/api/docs/campaigns/overview',
              topic: 'campaigns',
              url: 'https://developers.google.com/google-ads/api/docs/campaigns/overview'
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
        }),
        stdout: {
          write: () => true
        }
      }
    );

    expect(exitCode).toBe(0);
    expect(
      JSON.parse(await readFile(join(outDir, 'operations.json'), 'utf8'))
    ).toEqual([
      {
        httpMethod: 'POST',
        operationId: 'customers.campaigns.mutate',
        path: 'v22/customers/{+customerId}/campaigns:mutate'
      }
    ]);
    expect(
      JSON.parse(await readFile(join(outDir, 'docs-catalog.json'), 'utf8'))
    ).toEqual([
      {
        path: '/google-ads/api/docs/campaigns/overview',
        topic: 'campaigns',
        url: 'https://developers.google.com/google-ads/api/docs/campaigns/overview'
      }
    ]);
    expect(
      JSON.parse(await readFile(join(outDir, 'coverage.json'), 'utf8'))
    ).toEqual({
      coveredCountRequired: 1,
      totalCount: 1
    });
  });
});
