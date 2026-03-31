# google-ads-cli

Google Ads CLI and docs-to-skills workspace.

## What is here

- `gads docs sync` pulls official Google Ads API discovery and docs metadata into local JSON artifacts
- `gads api invoke <operation-id>` provides a raw CLI surface for discovery-backed methods
- `skills/` contains topic-based Google Ads skills for Codex and Claude Code
- `docs/research/` contains the current coverage baseline and acceptance math

## Current baseline

- Google Ads API version: `v22`
- Discovery methods captured: `162`
- 90% coverage threshold: `146`
- Topic skills scaffolded: `13`

## Quick start

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm exec tsx packages/cli/src/index.ts docs sync --version v22 --out-dir generated/google-ads/v22
pnpm exec tsx packages/cli/src/index.ts api invoke customers.campaigns.mutate \
  --catalog generated/google-ads/v22/operations.json \
  --access-token YOUR_ACCESS_TOKEN \
  --developer-token YOUR_DEVELOPER_TOKEN \
  --customer-id YOUR_CUSTOMER_ID \
  --dry-run
```
