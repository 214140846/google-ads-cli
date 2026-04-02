# google-ads-cli

A developer-first CLI for exploring Google Ads API docs locally, inspecting fields, and invoking discovery-backed operations from the terminal.

Sync the docs once, search them offline, inspect fields fast, and dry-run API calls without bouncing between scattered web docs and ad-hoc scripts.

`google-ads-cli` is a small monorepo with one job: make the Google Ads API easier to inspect and use without hiding the underlying surface area.

It does three things well:

- normalizes official Google Ads discovery + docs metadata into local artifacts
- exposes a thin CLI for auth, fields lookup, and raw API invocation
- packages topic-based Google Ads skills so Codex / Claude Code can stay grounded in official docs

This is not a full generated SDK, and it is not pretending to be one. It is an operator-first layer for people who want fast access to the real API surface.

## Why this exists

Most Google Ads tooling falls into one of two bad buckets:

- giant client libraries when you just want to inspect or hit one method
- scattered docs context when you want an LLM or teammate to work from official sources only

`google-ads-cli` closes that gap:

- use `gads docs *` to build a local, searchable view of the docs surface
- use `gads api invoke` to hit any discovery-backed REST method
- use `gads fields *` for the Google Ads Fields workflow
- use `gads auth *` to store profiles and stop retyping OAuth credentials
- use `skills/` + `skills-manifest.json` to map docs ranges into agent-friendly topic packs

## Highlights

- Full raw coverage through `gads api invoke <operation-id>`
- Searchable docs artifacts generated from official sources
- Thin helpers for Google Ads Fields operations
- Stored auth profiles in YAML at `~/.config/gads/config.yaml`
- Topic-based skill manifests for AI workflows
- A clean split between spec ingestion, request building, and CLI ergonomics

## Quickstart

### 1. Install and verify

```bash
pnpm install
pnpm test
pnpm typecheck
```

### 2. Sync the Google Ads docs + discovery artifacts

```bash
pnpm exec tsx packages/cli/src/index.ts docs sync \
  --version v22 \
  --out-dir generated/google-ads/v22
```

That writes:

- `generated/google-ads/v22/operations.json`
- `generated/google-ads/v22/docs-catalog.json`
- `generated/google-ads/v22/coverage.json`

### 3. Search the local docs catalog

```bash
pnpm exec tsx packages/cli/src/index.ts docs search \
  --catalog generated/google-ads/v22/docs-catalog.json \
  --topic campaigns \
  --query create
```

### 4. Inspect Google Ads fields

```bash
pnpm exec tsx packages/cli/src/index.ts fields search \
  --catalog generated/google-ads/v22/operations.json \
  --access-token YOUR_ACCESS_TOKEN \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --query "SELECT name WHERE name LIKE 'campaign.%'" \
  --dry-run
```

### 5. Dry-run one real API operation

```bash
pnpm exec tsx packages/cli/src/index.ts api invoke customers.campaigns.mutate \
  --catalog generated/google-ads/v22/operations.json \
  --access-token YOUR_ACCESS_TOKEN \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --customer-id YOUR_CUSTOMER_ID \
  --dry-run
```

That flow is the main story of the repo:

`sync -> search -> inspect -> invoke`

## Authentication and requirements

Before you send live Google Ads requests, you will usually need:

- a Google Ads `developer token`
- a Google OAuth `client_id` and `client_secret`
- either a fresh `access token` or a saved profile with a `refresh token`
- a `customer id` for customer-scoped operations

You have two paths:

- pass `--access-token` and `--developer-token` directly for ad-hoc calls
- save a profile once and reuse it with `--profile`

### Save a profile once

```bash
pnpm exec tsx packages/cli/src/index.ts auth init \
  --profile default \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --client-id YOUR_GOOGLE_OAUTH_CLIENT_ID \
  --client-secret YOUR_GOOGLE_OAUTH_CLIENT_SECRET \
  --default-customer-id YOUR_CUSTOMER_ID
```

If you already have a refresh token, save it too:

```bash
pnpm exec tsx packages/cli/src/index.ts auth init \
  --profile default \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --client-id YOUR_GOOGLE_OAUTH_CLIENT_ID \
  --client-secret YOUR_GOOGLE_OAUTH_CLIENT_SECRET \
  --refresh-token YOUR_REFRESH_TOKEN
```

### Generate the OAuth consent URL

```bash
pnpm exec tsx packages/cli/src/index.ts auth url \
  --profile default \
  --redirect-uri http://127.0.0.1:8085/callback
```

### Refresh an access token from the saved profile

```bash
pnpm exec tsx packages/cli/src/index.ts auth token \
  --profile default
```

### Invoke discovery-backed methods with a saved profile

Dry-run a mutate call using the stored profile:

```bash
pnpm exec tsx packages/cli/src/index.ts api invoke customers.campaigns.mutate \
  --catalog generated/google-ads/v22/operations.json \
  --profile default \
  --dry-run
```

Or pass credentials explicitly:

```bash
pnpm exec tsx packages/cli/src/index.ts api invoke customers.campaigns.mutate \
  --catalog generated/google-ads/v22/operations.json \
  --access-token YOUR_ACCESS_TOKEN \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --customer-id YOUR_CUSTOMER_ID \
  --body '{"operations":[]}' \
  --dry-run
```

### Inspect the AI skill manifest

```bash
pnpm exec tsx packages/cli/src/index.ts skills list \
  --manifest skills/skills-manifest.json

pnpm exec tsx packages/cli/src/index.ts skills show google-ads-auth \
  --manifest skills/skills-manifest.json
```

## How it fits together

```text
Google Ads docs + discovery
           |
           v
    gads docs sync
           |
           v
 generated/google-ads/v22/*
           |
   +-------+--------+------------------+
   |                |                  |
   v                v                  v
gads docs       gads fields        gads api invoke
search/show     search/get         any REST method

OAuth creds
    |
    v
gads auth init --> ~/.config/gads/config.yaml --> gads auth token / gads api invoke --profile
```

## Command surfaces

### `gads auth`

Use this when you want repeatable local auth without copying tokens around.

- `auth init` stores a named profile
- `auth url` builds the Google consent URL from that profile
- `auth token` refreshes an access token from the stored refresh token

### `gads docs`

Use this when you want a local, searchable snapshot of the official docs surface.

- `docs sync` pulls discovery + docs metadata into JSON artifacts
- `docs search` filters the normalized docs catalog
- `docs show` displays one exact docs entry

### `gads fields`

Use this for Google Ads Fields workflows.

- `fields search` builds the `googleAdsFields.search` request payload
- `fields get` resolves a single field resource

### `gads api invoke`

Use this when you want raw access to any discovery-backed Google Ads REST method.

- pass `--access-token` and `--developer-token` directly
- or use `--profile` to load credentials from config
- use `--dry-run` first so you can inspect the exact request before sending it

### `gads skills`

Use this when your workflow includes Codex / Claude Code and you want topic-specific Google Ads context.

- `skills list` returns the full manifest
- `skills show` returns one skill entry with its owned docs range

## Project layout

```text
packages/
  cli/    Commander-based command surface
  core/   request building, OAuth helpers, profile storage
  spec/   docs/discovery normalization and shortcut generation

generated/google-ads/v22/
  operations.json
  docs-catalog.json
  coverage.json

skills/
  topic-based Google Ads skills for agent workflows

docs/research/
  coverage baseline, scope math, and source references
```

## Current baseline

From the current research baseline:

- Google Ads API discovery version: `v22`
- Discovery methods captured: `162`
- 90% coverage threshold: `146`
- Official docs pages discovered: `269`
- Topic skills scaffolded: `13`

The working model is simple:

- raw API coverage comes from discovery-backed invocation
- doc coverage is mapped into `skills/`
- higher-level typed shortcuts can be layered on later without losing raw access

## Development

Run the usual checks:

```bash
pnpm test
pnpm typecheck
```

Typical local loop:

```bash
pnpm exec tsx packages/cli/src/index.ts docs sync --version v22 --out-dir generated/google-ads/v22
pnpm exec tsx packages/cli/src/index.ts docs search --catalog generated/google-ads/v22/docs-catalog.json --topic campaigns --query create
pnpm exec tsx packages/cli/src/index.ts api invoke customers.campaigns.mutate --catalog generated/google-ads/v22/operations.json --profile default --dry-run
```

## Skills

The repo ships topic-based Google Ads skills for agent workflows, including:

- `google-ads-auth`
- `google-ads-query`
- `google-ads-mutate`
- `google-ads-campaigns`
- `google-ads-conversions`
- `google-ads-troubleshooting`

See [skills/README.md](./skills/README.md) for the topic map and [skills/skills-manifest.json](./skills/skills-manifest.json) for the generated manifest.

## Source policy

The research baseline is built from official Google Ads sources only:

- docs home
- REST discovery
- RPC reference
- REST auth / headers docs
- fields reference
- Google Ads developer toolkit docs

If a workflow needs policy or product guidance, keep that in `skills/`. If it needs executable API behavior, keep it in the CLI.
