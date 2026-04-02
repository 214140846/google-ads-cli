import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads auth init + url', () => {
  it('stores a profile and prints an auth URL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gads-auth-'));
    const configPath = join(dir, 'config.yaml');
    const chunks: string[] = [];

    expect(
      await runCli([
        'auth',
        'init',
        '--config',
        configPath,
        '--profile',
        'default',
        '--developer-token',
        'dev-456',
        '--client-id',
        'client-id',
        '--client-secret',
        'client-secret',
        '--default-customer-id',
        '5554443333'
      ])
    ).toBe(0);

    expect(
      await runCli(
        [
          'auth',
          'url',
          '--config',
          configPath,
          '--profile',
          'default',
          '--redirect-uri',
          'http://127.0.0.1:8085/callback'
        ],
        {
          stdout: {
            write: (value: string) => {
              chunks.push(value);
              return true;
            }
          }
        }
      )
    ).toBe(0);

    expect(chunks.join('')).toContain('accounts.google.com');
    expect(chunks.join('')).toContain('client_id=client-id');
  });
});

describe('gads auth token', () => {
  it('refreshes an access token from a stored profile', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gads-auth-'));
    const configPath = join(dir, 'config.yaml');
    const chunks: string[] = [];

    await runCli([
      'auth',
      'init',
      '--config',
      configPath,
      '--profile',
      'default',
      '--developer-token',
      'dev-456',
      '--client-id',
      'client-id',
      '--client-secret',
      'client-secret',
      '--refresh-token',
      'refresh-456'
    ]);

    const exitCode = await runCli(
      ['auth', 'token', '--config', configPath, '--profile', 'default'],
      {
        oauthFetch: async () =>
          new Response(
            JSON.stringify({
              access_token: 'access-789',
              expires_in: 3600,
              scope: 'https://www.googleapis.com/auth/adwords',
              token_type: 'Bearer'
            }),
            { status: 200 }
          ),
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
      access_token: 'access-789',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/adwords',
      token_type: 'Bearer'
    });
  });
});

describe('gads api invoke --profile', () => {
  it('uses a stored profile when access-token and developer-token flags are omitted', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gads-auth-'));
    const configPath = join(dir, 'config.yaml');
    const chunks: string[] = [];

    await runCli([
      'auth',
      'init',
      '--config',
      configPath,
      '--profile',
      'default',
      '--developer-token',
      'dev-456',
      '--client-id',
      'client-id',
      '--client-secret',
      'client-secret',
      '--refresh-token',
      'refresh-456',
      '--default-customer-id',
      '5554443333',
      '--login-customer-id',
      '1234567890'
    ]);

    const exitCode = await runCli(
      [
        'api',
        'invoke',
        'customers.campaigns.mutate',
        '--catalog',
        'generated/google-ads/v22/operations.json',
        '--config',
        configPath,
        '--profile',
        'default',
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
        oauthFetch: async () =>
          new Response(
            JSON.stringify({
              access_token: 'access-789',
              expires_in: 3600,
              scope: 'https://www.googleapis.com/auth/adwords',
              token_type: 'Bearer'
            }),
            { status: 200 }
          ),
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
      operationId: 'customers.campaigns.mutate',
      url: 'https://googleads.googleapis.com/v22/customers/5554443333/campaigns:mutate',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer access-789',
          'developer-token': 'dev-456',
          'login-customer-id': '1234567890'
        }
      }
    });
  });
});
