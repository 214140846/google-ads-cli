import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads docs search', () => {
  it('filters docs entries by topic and free text', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      ['docs', 'search', '--catalog', 'generated/google-ads/v22/docs-catalog.json', '--topic', 'campaigns', '--query', 'create'],
      {
        loadDocsCatalog: async () => [
          {
            path: '/google-ads/api/docs/campaigns/create-campaigns',
            topic: 'campaigns',
            url: 'https://developers.google.com/google-ads/api/docs/campaigns/create-campaigns'
          },
          {
            path: '/google-ads/api/docs/conversions/overview',
            topic: 'conversions',
            url: 'https://developers.google.com/google-ads/api/docs/conversions/overview'
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
    expect(JSON.parse(chunks.join(''))).toEqual([
      {
        path: '/google-ads/api/docs/campaigns/create-campaigns',
        topic: 'campaigns',
        url: 'https://developers.google.com/google-ads/api/docs/campaigns/create-campaigns'
      }
    ]);
  });
});

describe('gads docs show', () => {
  it('returns a single docs entry by exact path', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      ['docs', 'show', '/google-ads/api/docs/campaigns/overview', '--catalog', 'generated/google-ads/v22/docs-catalog.json'],
      {
        loadDocsCatalog: async () => [
          {
            path: '/google-ads/api/docs/campaigns/overview',
            topic: 'campaigns',
            url: 'https://developers.google.com/google-ads/api/docs/campaigns/overview'
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
      path: '/google-ads/api/docs/campaigns/overview',
      topic: 'campaigns',
      url: 'https://developers.google.com/google-ads/api/docs/campaigns/overview'
    });
  });
});
