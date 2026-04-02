import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  loadGoogleAdsConfig,
  saveGoogleAdsConfig,
  upsertGoogleAdsProfile
} from '../src/profile.js';

describe('google ads profile config', () => {
  it('saves and loads yaml config files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gads-profile-'));
    const configPath = join(dir, 'config.yaml');

    await saveGoogleAdsConfig(configPath, {
      profiles: {
        default: {
          api_version: 'v22',
          client_id: 'client-id',
          client_secret: 'client-secret',
          developer_token: 'developer-token',
          refresh_token: 'refresh-token'
        }
      }
    });

    expect(await loadGoogleAdsConfig(configPath)).toEqual({
      profiles: {
        default: {
          api_version: 'v22',
          client_id: 'client-id',
          client_secret: 'client-secret',
          developer_token: 'developer-token',
          refresh_token: 'refresh-token'
        }
      }
    });
    expect(await readFile(configPath, 'utf8')).toContain('developer_token');
  });

  it('upserts a named profile without dropping other profiles', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gads-profile-'));
    const configPath = join(dir, 'config.yaml');

    await saveGoogleAdsConfig(configPath, {
      profiles: {
        keep: {
          api_version: 'v22',
          client_id: 'keep-client',
          client_secret: 'keep-secret',
          developer_token: 'keep-dev'
        }
      }
    });

    await upsertGoogleAdsProfile(configPath, 'default', {
      api_version: 'v22',
      client_id: 'client-id',
      client_secret: 'client-secret',
      developer_token: 'developer-token',
      refresh_token: 'refresh-token'
    });

    expect(await loadGoogleAdsConfig(configPath)).toEqual({
      profiles: {
        keep: {
          api_version: 'v22',
          client_id: 'keep-client',
          client_secret: 'keep-secret',
          developer_token: 'keep-dev'
        },
        default: {
          api_version: 'v22',
          client_id: 'client-id',
          client_secret: 'client-secret',
          developer_token: 'developer-token',
          refresh_token: 'refresh-token'
        }
      }
    });
  });
});
