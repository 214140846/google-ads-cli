import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

import { parse, stringify } from 'yaml';

export interface GoogleAdsProfile {
  api_version: string;
  developer_token: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  default_customer_id?: string;
  login_customer_id?: string;
  linked_customer_id?: string;
}

export interface GoogleAdsConfig {
  profiles: Record<string, GoogleAdsProfile>;
}

export function getDefaultGoogleAdsConfigPath(): string {
  return join(homedir(), '.config', 'gads', 'config.yaml');
}

export async function loadGoogleAdsConfig(
  configPath: string = getDefaultGoogleAdsConfigPath()
): Promise<GoogleAdsConfig> {
  try {
    const file = await readFile(configPath, 'utf8');
    const parsed = parse(file) as GoogleAdsConfig | null;

    return {
      profiles: parsed?.profiles ?? {}
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { profiles: {} };
    }

    throw error;
  }
}

export async function saveGoogleAdsConfig(
  configPath: string,
  config: GoogleAdsConfig
): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, stringify(config), 'utf8');
}

export async function upsertGoogleAdsProfile(
  configPath: string,
  profileName: string,
  profile: GoogleAdsProfile
): Promise<GoogleAdsConfig> {
  const config = await loadGoogleAdsConfig(configPath);
  const nextConfig: GoogleAdsConfig = {
    profiles: {
      ...config.profiles,
      [profileName]: profile
    }
  };

  await saveGoogleAdsConfig(configPath, nextConfig);
  return nextConfig;
}

export async function getGoogleAdsProfile(
  configPath: string,
  profileName: string
): Promise<GoogleAdsProfile> {
  const config = await loadGoogleAdsConfig(configPath);
  const profile = config.profiles[profileName];

  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  return profile;
}
