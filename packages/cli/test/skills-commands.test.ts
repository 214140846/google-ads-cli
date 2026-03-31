import { describe, expect, it } from 'vitest';

import { runCli } from '../src/index.js';

describe('gads skills list', () => {
  it('lists skills from the manifest', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      ['skills', 'list', '--manifest', 'skills/skills-manifest.json'],
      {
        loadSkillsManifest: async () => [
          {
            name: 'google-ads-auth',
            description: 'Use when working with Google Ads API authentication.',
            docs_range: ['oauth', 'api-policy'],
            page_count: 25,
            source_skill_path: 'skills/google-ads-auth/SKILL.md'
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
        name: 'google-ads-auth',
        description: 'Use when working with Google Ads API authentication.',
        docs_range: ['oauth', 'api-policy'],
        page_count: 25,
        source_skill_path: 'skills/google-ads-auth/SKILL.md'
      }
    ]);
  });
});

describe('gads skills show', () => {
  it('returns a single skill entry by name', async () => {
    const chunks: string[] = [];

    const exitCode = await runCli(
      ['skills', 'show', 'google-ads-auth', '--manifest', 'skills/skills-manifest.json'],
      {
        loadSkillsManifest: async () => [
          {
            name: 'google-ads-auth',
            description: 'Use when working with Google Ads API authentication.',
            docs_range: ['oauth', 'api-policy'],
            page_count: 25,
            source_skill_path: 'skills/google-ads-auth/SKILL.md'
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
      name: 'google-ads-auth',
      description: 'Use when working with Google Ads API authentication.',
      docs_range: ['oauth', 'api-policy'],
      page_count: 25,
      source_skill_path: 'skills/google-ads-auth/SKILL.md'
    });
  });
});
