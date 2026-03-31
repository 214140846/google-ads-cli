---
name: google-ads-mutate
description: Use when creating, updating, removing, or bulk-mutating Google Ads resources, including partial failures, temporary IDs, and batch jobs.
---

# Google Ads Mutate

Use this skill for mutation semantics and bulk-write workflows.

- Primary docs topics: `mutating`, `batch-processing`
- Start from [`../../docs/research/google-ads-capability-baseline.md`](../../docs/research/google-ads-capability-baseline.md)
- Use [`../../generated/google-ads/v22/docs-catalog.json`](../../generated/google-ads/v22/docs-catalog.json) to locate official mutate and batch-processing pages
- Route raw execution through `gads api invoke <operation-id>` with `--body` or `--body-file`
