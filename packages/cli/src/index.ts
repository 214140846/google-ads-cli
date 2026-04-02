#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Command } from 'commander';

import { syncGoogleAdsCatalog } from '../../spec/src/index.js';
import {
  buildGoogleAdsAuthUrl,
  buildGoogleAdsRequest,
  getDefaultGoogleAdsConfigPath,
  getGoogleAdsProfile,
  refreshGoogleAdsAccessToken,
  upsertGoogleAdsProfile
} from '../../core/src/index.js';

import type { DocsCatalogEntry, SyncedGoogleAdsCatalog } from '../../spec/src/index.js';
import type {
  GoogleAdsProfile as StoredGoogleAdsProfile,
  OAuthFetch,
  OperationDescriptor
} from '../../core/src/index.js';

export interface SkillManifestEntry {
  name: string;
  description: string;
  docs_range: string[];
  page_count: number;
  source_skill_path: string;
}

export interface CliDependencies {
  syncCatalog?: (options: { version: string }) => Promise<SyncedGoogleAdsCatalog>;
  loadOperationsCatalog?: (path: string) => Promise<OperationDescriptor[]>;
  loadDocsCatalog?: (path: string) => Promise<DocsCatalogEntry[]>;
  loadSkillsManifest?: (path: string) => Promise<SkillManifestEntry[]>;
  oauthFetch?: OAuthFetch;
  stdout?: Pick<NodeJS.WriteStream, 'write'>;
}

async function writeCatalogOutputs(
  outDir: string,
  catalog: SyncedGoogleAdsCatalog
): Promise<void> {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(join(outDir, 'operations.json'), JSON.stringify(catalog.operations, null, 2)),
    writeFile(join(outDir, 'docs-catalog.json'), JSON.stringify(catalog.docsEntries, null, 2)),
    writeFile(join(outDir, 'coverage.json'), JSON.stringify(catalog.coverage, null, 2))
  ]);
}

export async function runCli(
  argv: string[],
  dependencies: CliDependencies = {}
): Promise<number> {
  const program = new Command();
  const stdout = dependencies.stdout ?? process.stdout;
  const syncCatalog =
    dependencies.syncCatalog ?? ((options: { version: string }) => syncGoogleAdsCatalog(options));
  const loadOperationsCatalog =
    dependencies.loadOperationsCatalog ??
    (async (path: string) =>
      JSON.parse(await readFile(path, 'utf8')) as OperationDescriptor[]);
  const loadDocsCatalog =
    dependencies.loadDocsCatalog ??
    (async (path: string) => JSON.parse(await readFile(path, 'utf8')) as DocsCatalogEntry[]);
  const loadSkillsManifest =
    dependencies.loadSkillsManifest ??
    (async (path: string) =>
      (JSON.parse(await readFile(path, 'utf8')) as { skills: SkillManifestEntry[] }).skills);
  const oauthFetch = dependencies.oauthFetch ?? fetch;

  const writeJson = (value: unknown): void => {
    stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  };

  const resolveConfigPath = (configPath?: string): string =>
    configPath ?? getDefaultGoogleAdsConfigPath();

  const loadProfile = async (options: {
    config?: string;
    profile?: string;
  }): Promise<StoredGoogleAdsProfile> =>
    getGoogleAdsProfile(resolveConfigPath(options.config), options.profile ?? 'default');

  const resolveOperation = async (
    catalogPath: string,
    operationId: string
  ): Promise<OperationDescriptor> => {
    const operations = await loadOperationsCatalog(catalogPath);
    const operation = operations.find((entry) => entry.operationId === operationId);

    if (!operation) {
      throw new Error(`Unknown operation id: ${operationId}`);
    }

    return operation;
  };

  const executeOrDryRun = async (options: {
    operation: OperationDescriptor;
    accessToken?: string;
    developerToken?: string;
    loginCustomerId?: string;
    linkedCustomerId?: string;
    pathParams?: Record<string, string>;
    payload?: unknown;
    dryRun?: boolean;
  }): Promise<void> => {
    if (!options.accessToken) {
      throw new Error('--access-token is required');
    }

    if (!options.developerToken) {
      throw new Error('--developer-token is required');
    }

    const request = buildGoogleAdsRequest({
      accessToken: options.accessToken,
      developerToken: options.developerToken,
      linkedCustomerId: options.linkedCustomerId,
      loginCustomerId: options.loginCustomerId,
      operation: options.operation,
      pathParams: options.pathParams,
      payload: options.payload
    });

    if (options.dryRun) {
      writeJson(request);
      return;
    }

    const response = await fetch(request.url, request.init);
    stdout.write(await response.text());
  };

  program.name('gads');

  const auth = program.command('auth').description('Manage Google Ads OAuth profiles');

  auth
    .command('init')
    .option('--config <path>', 'Path to the YAML config file')
    .option('--profile <name>', 'Profile name', 'default')
    .option('--api-version <version>', 'Google Ads API version', 'v22')
    .requiredOption('--developer-token <token>', 'Google Ads developer token')
    .requiredOption('--client-id <id>', 'Google OAuth client id')
    .requiredOption('--client-secret <secret>', 'Google OAuth client secret')
    .option('--refresh-token <token>', 'OAuth refresh token')
    .option('--default-customer-id <id>', 'Default customer id for customer-scoped operations')
    .option('--login-customer-id <id>', 'Manager account id')
    .option('--linked-customer-id <id>', 'Linked customer id')
    .action(
      async (options: {
        apiVersion: string;
        clientId: string;
        clientSecret: string;
        config?: string;
        defaultCustomerId?: string;
        developerToken: string;
        linkedCustomerId?: string;
        loginCustomerId?: string;
        profile: string;
        refreshToken?: string;
      }) => {
        await upsertGoogleAdsProfile(resolveConfigPath(options.config), options.profile, {
          api_version: options.apiVersion,
          client_id: options.clientId,
          client_secret: options.clientSecret,
          developer_token: options.developerToken,
          ...(options.refreshToken ? { refresh_token: options.refreshToken } : {}),
          ...(options.defaultCustomerId
            ? { default_customer_id: options.defaultCustomerId }
            : {}),
          ...(options.loginCustomerId ? { login_customer_id: options.loginCustomerId } : {}),
          ...(options.linkedCustomerId ? { linked_customer_id: options.linkedCustomerId } : {})
        });
      }
    );

  auth
    .command('url')
    .option('--config <path>', 'Path to the YAML config file')
    .option('--profile <name>', 'Profile name', 'default')
    .requiredOption('--redirect-uri <uri>', 'OAuth redirect URI')
    .option('--state <value>', 'Opaque OAuth state value')
    .action(
      async (options: {
        config?: string;
        profile: string;
        redirectUri: string;
        state?: string;
      }) => {
        const profile = await loadProfile(options);
        stdout.write(
          `${buildGoogleAdsAuthUrl({
            clientId: profile.client_id,
            redirectUri: options.redirectUri,
            ...(options.state ? { state: options.state } : {})
          })}\n`
        );
      }
    );

  auth
    .command('token')
    .option('--config <path>', 'Path to the YAML config file')
    .option('--profile <name>', 'Profile name', 'default')
    .action(async (options: { config?: string; profile: string }) => {
      const profile = await loadProfile(options);

      if (!profile.refresh_token) {
        throw new Error(`Profile ${options.profile} is missing refresh_token`);
      }

      writeJson(
        await refreshGoogleAdsAccessToken(
          {
            clientId: profile.client_id,
            clientSecret: profile.client_secret,
            refreshToken: profile.refresh_token
          },
          oauthFetch
        )
      );
    });

  const docs = program
    .command('docs')
    .description('Work with normalized Google Ads documentation artifacts');

  docs
    .command('sync')
    .requiredOption('--version <version>', 'Google Ads API version', 'v22')
    .requiredOption('--out-dir <outDir>', 'Directory to write normalized artifacts')
    .action(async (options: { version: string; outDir: string }) => {
      const catalog = await syncCatalog({ version: options.version });
      await writeCatalogOutputs(options.outDir, catalog);
      stdout.write(
        `synced ${catalog.operations.length} operations and ${catalog.docsEntries.length} docs entries to ${options.outDir}\n`
      );
    });

  docs
    .command('search')
    .requiredOption('--catalog <path>', 'Path to docs-catalog.json generated by docs sync')
    .option('--topic <topic>', 'Filter by docs topic')
    .option('--query <query>', 'Case-insensitive substring match against path and URL')
    .action(async (options: { catalog: string; query?: string; topic?: string }) => {
      const docsEntries = await loadDocsCatalog(options.catalog);
      const normalizedQuery = options.query?.toLowerCase();
      const results = docsEntries.filter((entry) => {
        if (options.topic && entry.topic !== options.topic) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return `${entry.path} ${entry.url}`.toLowerCase().includes(normalizedQuery);
      });

      writeJson(results);
    });

  docs
    .command('show')
    .argument('<docId>', 'Exact docs path or URL')
    .requiredOption('--catalog <path>', 'Path to docs-catalog.json generated by docs sync')
    .action(async (docId: string, options: { catalog: string }) => {
      const docsEntries = await loadDocsCatalog(options.catalog);
      const doc = docsEntries.find((entry) => entry.path === docId || entry.url === docId);

      if (!doc) {
        throw new Error(`Unknown docs entry: ${docId}`);
      }

      writeJson(doc);
    });

  const skills = program.command('skills').description('Inspect Google Ads skill assets');

  skills
    .command('list')
    .requiredOption('--manifest <path>', 'Path to skills/skills-manifest.json')
    .action(async (options: { manifest: string }) => {
      writeJson(await loadSkillsManifest(options.manifest));
    });

  skills
    .command('show')
    .argument('<skillName>', 'Skill name such as google-ads-auth')
    .requiredOption('--manifest <path>', 'Path to skills/skills-manifest.json')
    .action(async (skillName: string, options: { manifest: string }) => {
      const manifest = await loadSkillsManifest(options.manifest);
      const skill = manifest.find((entry) => entry.name === skillName);

      if (!skill) {
        throw new Error(`Unknown skill: ${skillName}`);
      }

      writeJson(skill);
    });

  const api = program.command('api').description('Raw Google Ads API access');

  api
    .command('invoke')
    .argument('<operationId>', 'Discovery operation id such as customers.campaigns.mutate')
    .requiredOption('--catalog <path>', 'Path to operations.json generated by docs sync')
    .option('--config <path>', 'Path to the YAML config file')
    .option('--profile <name>', 'Stored profile name')
    .option('--access-token <token>', 'OAuth access token')
    .option('--developer-token <token>', 'Google Ads developer token')
    .option('--login-customer-id <id>', 'Manager account acting on behalf of the target account')
    .option('--linked-customer-id <id>', 'Linked customer id for select product operations')
    .option('--customer-id <id>', 'Convenience alias for path param customerId')
    .option('--path-param <pair...>', 'Extra path param in name=value form')
    .option('--body <json>', 'Inline JSON request body')
    .option('--body-file <path>', 'Path to a JSON request body file')
    .option('--dry-run', 'Print the resolved HTTP request instead of sending it')
    .action(
      async (
        operationId: string,
        options: {
          accessToken?: string;
          body?: string;
          bodyFile?: string;
          catalog: string;
          config?: string;
          customerId?: string;
          developerToken?: string;
          dryRun?: boolean;
          linkedCustomerId?: string;
          loginCustomerId?: string;
          pathParam?: string[];
          profile?: string;
        }
      ) => {
        const operation = await resolveOperation(options.catalog, operationId);
        const profile = options.profile ? await loadProfile(options) : undefined;

        const pathParams = Object.fromEntries(
          (options.pathParam ?? []).map((pair) => {
            const [key, value] = pair.split('=');

            if (!key || !value) {
              throw new Error(`Invalid --path-param value: ${pair}`);
            }

            return [key, value];
          })
        );

        if (options.customerId ?? profile?.default_customer_id) {
          pathParams.customerId = options.customerId ?? profile?.default_customer_id ?? '';
        }

        const payload =
          options.body !== undefined
            ? JSON.parse(options.body)
            : options.bodyFile
              ? JSON.parse(await readFile(options.bodyFile, 'utf8'))
              : undefined;
        const accessToken =
          options.accessToken ??
          (profile?.refresh_token
            ? (
                await refreshGoogleAdsAccessToken(
                  {
                    clientId: profile.client_id,
                    clientSecret: profile.client_secret,
                    refreshToken: profile.refresh_token
                  },
                  oauthFetch
                )
              ).access_token
            : undefined);
        await executeOrDryRun({
          accessToken,
          developerToken: options.developerToken ?? profile?.developer_token,
          dryRun: options.dryRun,
          linkedCustomerId: options.linkedCustomerId ?? profile?.linked_customer_id,
          loginCustomerId: options.loginCustomerId ?? profile?.login_customer_id,
          operation,
          pathParams,
          payload
        });
      }
    );

  const fields = program.command('fields').description('Google Ads Fields API helpers');

  fields
    .command('search')
    .requiredOption('--catalog <path>', 'Path to operations.json generated by docs sync')
    .requiredOption('--access-token <token>', 'OAuth access token')
    .requiredOption('--developer-token <token>', 'Google Ads developer token')
    .requiredOption('--query <query>', 'Google Ads Fields query')
    .option('--dry-run', 'Print the resolved HTTP request instead of sending it')
    .action(
      async (options: {
        accessToken: string;
        catalog: string;
        developerToken: string;
        dryRun?: boolean;
        query: string;
      }) => {
        const operation = await resolveOperation(options.catalog, 'googleAdsFields.search');
        await executeOrDryRun({
          operation,
          accessToken: options.accessToken,
          developerToken: options.developerToken,
          payload: { query: options.query },
          dryRun: options.dryRun
        });
      }
    );

  fields
    .command('get')
    .argument('<resourceName>', 'Field resource name such as googleAdsFields/campaign.id')
    .requiredOption('--catalog <path>', 'Path to operations.json generated by docs sync')
    .requiredOption('--access-token <token>', 'OAuth access token')
    .requiredOption('--developer-token <token>', 'Google Ads developer token')
    .option('--dry-run', 'Print the resolved HTTP request instead of sending it')
    .action(
      async (
        resourceName: string,
        options: {
          accessToken: string;
          catalog: string;
          developerToken: string;
          dryRun?: boolean;
        }
      ) => {
        const operation = await resolveOperation(options.catalog, 'googleAdsFields.get');
        await executeOrDryRun({
          operation,
          accessToken: options.accessToken,
          developerToken: options.developerToken,
          pathParams: { resourceName },
          dryRun: options.dryRun
        });
      }
    );

  try {
    await program.parseAsync(argv, { from: 'user' });
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      stdout.write(`${error.message}\n`);
    }

    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exit(exitCode);
}
