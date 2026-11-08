# BLUEPRINT — GitHub Telemetry Automation Specification
## Architecture, Workflow, and Verification Protocol

**Document Reference:** `SAHA-BP-2026-02-SYNC-01`<br>
**Milestone:** BLUEPRINT V1.0.1<br>
**Project:** BLUEPRINT / FORGE RUNTIME<br>
**Workspace:** `/home/sanchayan/Projects/BLUEPRINT`<br>
**Repository:** [sahasanchayan44-tech/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech)<br>
**Production URL:** [https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/](https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/)<br>
**Target File:** `docs/data/github-data.json`<br>
**Workflow File:** `.github/workflows/github-telemetry-sync.yml`

---

## 1. ARCHITECTURE OVERVIEW

BLUEPRINT implements an automated, deterministic telemetry synchronization pipeline designed to keep public GitHub data fresh while preserving the stability and integrity of the production portfolio.

```
┌────────────────────────────────────────────────────────────────────────┐
│               BLUEPRINT TELEMETRY SYNCHRONIZATION PIPELINE             │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ 01 · TRIGGER        │ 02 · INGEST & VALIDATE    │ 03 · SAFE PUBLISH    │
│ Schedule (02:17 UTC)│ Unauthenticated REST GET  │ Substantive diff     │
│ workflow_dispatch   │ Draft-07 Schema validator │ Atomic write & push  │
│ Concurrency lock    │ Zero-email privacy gate   │ GitHub Pages deploy  │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

The system operates under three architectural invariants:
1. **Zero External Browser Requests:** The frontend web application never queries the external GitHub API directly. It consumes only the validated local static snapshot `docs/data/github-data.json`.
2. **Schema-Gated Mutation:** The production snapshot is only modified when freshly ingested data passes strict Draft-07 schema validation and privacy checks.
3. **No-Op Unchanged Snapshots:** If GitHub data has not substantively changed, no unnecessary Git commits are created.

---

## 2. DATA COLLECTION PROCESS

The canonical collector is implemented in `scripts/fetch-public-github-data.js` via the `GitHubCollector` class:

1. **Pre-Flight Quota Gate:** Queries `/rate_limit`. If remaining unauthenticated quota is less than the safety threshold (>= 35 remaining out of 60), the run aborts immediately, preserving the existing snapshot intact.
2. **Profile Ingestion:** Queries `/users/sahasanchayan44-tech` to retrieve public repo count, followers, following, gists, and account metadata.
3. **Dynamic Repository Discovery:** Queries `/users/sahasanchayan44-tech/repos?per_page=100&type=public&sort=updated`. Automatically discovers newly created public repositories and maps their architectural metadata.
4. **Public Events Stream:** Ingests public activity from `/users/sahasanchayan44-tech/events/public?per_page=100` (rolling 90-day window).
5. **Language & Commit Distributions:** Ingests language breakdowns and the latest 5 commits for each discovered public repository.
6. **Milestone Cross-Verification:** Verifies the 11 audited historical milestone commit SHAs against commit histories and profile records.
7. **Telemetry Aggregation:** Calculates aggregated metrics (total stars, total forks, primary ecosystems, account age in days).

---

## 3. GITHUB API ENDPOINTS USED

All requests are strictly unauthenticated public HTTP GET requests:

| API Endpoint | HTTP Method | Scope & Purpose |
| :--- | :---: | :--- |
| `https://api.github.com/rate_limit` | `GET` | Pre-flight quota check against the safety threshold (>= 35). |
| `https://api.github.com/users/sahasanchayan44-tech` | `GET` | Public profile statistics (repos, followers, created_at). |
| `https://api.github.com/users/sahasanchayan44-tech/repos` | `GET` | Discovery of all public repositories, default branches, and star/fork counts. |
| `https://api.github.com/users/sahasanchayan44-tech/events/public` | `GET` | Public activity stream (up to 90 days or 300 events). |
| `https://api.github.com/repos/sahasanchayan44-tech/{repo}/languages` | `GET` | Language byte counts per public repository. |
| `https://api.github.com/repos/sahasanchayan44-tech/{repo}/commits` | `GET` | Recent commits (latest 5 per repository). |
| `https://api.github.com/repos/sahasanchayan44-tech/{repo}/commits/{sha}` | `GET` | Fallback single-commit query for historical milestone verification if not in recent 5. |

---

## 4. WORKFLOW SCHEDULE & TIMEZONE

The GitHub Actions workflow is defined in `.github/workflows/github-telemetry-sync.yml`.

- **Cron Expression:** `17 2 * * *`
- **Schedule Time:** 02:17 UTC daily (07:47 IST).
- **Timezone Note:** GitHub Actions cron schedules operate strictly in **Universal Time Coordinated (UTC)**.
- **Timing Rationale:** 02:17 UTC avoids top-of-the-hour load spikes on GitHub Actions infrastructure.

---

## 5. MANUAL EXECUTION INSTRUCTIONS

Manual synchronization can be triggered on demand via the GitHub web UI or the GitHub CLI:

### Via GitHub CLI (`gh`)
```bash
# Standard synchronization (only commits if substantive data changed)
gh workflow run github-telemetry-sync.yml

# Force snapshot write and commit regardless of substantive diff
gh workflow run github-telemetry-sync.yml -f force_update=true

# View run status
gh run list --workflow=github-telemetry-sync.yml
```

### Via GitHub Web Interface
1. Navigate to the repository's **Actions** tab.
2. Select **Daily GitHub Telemetry Synchronization** from the left sidebar.
3. Click **Run workflow**, choose branch `main`, and optionally check **Force snapshot write**.
4. Click the green **Run workflow** button.

---

## 6. VALIDATION PROCESS

Before any file is written to `docs/data/github-data.json`, three strict validation tiers must pass:

1. **Privacy Assertion (Zero Emails):** Scans the serialized JSON payload for email patterns. If any email is detected, the run aborts immediately.
2. **Draft-07 Schema Validation:** Validates the complete JSON structure against `docs/data/github-data-schema.json`. Requires all 7 top-level keys (`provenance`, `user`, `telemetry`, `repositories`, `historical_milestones`, `recent_repository_commits`, `limitations`), correct types, and non-empty arrays.
3. **Substantive Change Detection (`--only-if-changed`):** Compares user stats, repository metadata, star/fork counts, languages, and commit SHAs against the existing snapshot. If no substantive change occurred, the file write is skipped.

---

## 7. FAILURE HANDLING & ATOMICITY

- **Rate Limit Exhaustion:** If remaining quota is < 35, the collector logs `[ABORT]` and exits with code 1. The existing production snapshot remains untouched.
- **Transient HTTP / Network Failures:** Handled with bounded exponential backoff (1s, 2s, 4s delays, max 3 retries).
- **Atomic File System Write:** The collector writes to `docs/data/github-data.json.tmp` first. Only upon successful flush and close is the temporary file atomically renamed to `docs/data/github-data.json`.
- **Guaranteed Cleanup:** A `finally` block unlinks `.tmp` files if any write or rename step encounters an exception.
- **Workflow Safety:** If the collector fails, the step exits with code 1; the commit and push steps are skipped; no corrupted data is committed.

---

## 8. SECURITY & PERMISSIONS

- **Minimal Token Scope:** The workflow uses explicit scoped permissions:
  ```yaml
  permissions:
    contents: write
    pull-requests: write
  ```
- **Zero Secrets / Tokens in Data:** No personal access tokens or credentials are embedded in scripts or stored in repository data files.
- **Zero Private Data Ingestion:** All queries target strictly public `/users/` and `/repos/` endpoints. Private repositories and organizations are completely isolated and inaccessible.
- **Concurrency Guard:**
  ```yaml
  concurrency:
    group: github-telemetry-sync
    cancel-in-progress: false
  ```
  Prevents simultaneous overlapping synchronization jobs.

---

## 8.1 OPERATIONAL POSTURE & AUTOMATION STATUS MATRIX

To maintain absolute documentation accuracy, the telemetry automation components are categorized by operational readiness:

| Architecture Component | Status | Operational Classification |
| :--- | :---: | :--- |
| **Workflow PR & Auto-Merge Pipeline** | `VERIFIED` | Implemented in `.github/workflows/github-telemetry-sync.yml`. Tested in PR #4 (`42522178515`). |
| **Scheduled Telemetry Execution** | `VERIFIED` | Cron schedule active at `17 2 * * *` UTC on `main`. |
| **Draft-07 Schema Gating & Zero-Email** | `VERIFIED` | 100% verified across pre-flight and pre-commit test harnesses. |
| **GitHub App Authentication Secrets** | `PENDING OWNER ACTION` | Repository secrets (`TELEMETRY_APP_ID`, `TELEMETRY_APP_PRIVATE_KEY`) await owner configuration. Workflow degrades gracefully when omitted. |
| **Repository Auto-Merge Setting** | `PENDING OWNER ACTION` | Requires owner activation of `allow_auto_merge` in GitHub repository settings UI. |
| **Main Branch Ruleset Enforcement** | `PENDING OWNER ACTION` | Ruleset specification verified with zero bypasses; held disabled until App credentials are configured. |

> [!NOTE]
> Pending owner actions represent planned governance and authentication configurations that cannot be automated via standard runner tokens. They must not be described as currently operational features.

---

## 9. HOW TO INSPECT THE LAST SUCCESSFUL SYNCHRONIZATION

Inspect `docs/data/github-data.json` directly or query the provenance object:

```bash
# Inspect collection timestamp and rate limit status
jq '.provenance' docs/data/github-data.json

# Check repository count and latest discovered repos
jq '{repo_count: (.repositories | length), repos: [.repositories[].name]}' docs/data/github-data.json

# Check aggregated stars and forks
jq '.telemetry' docs/data/github-data.json
```

In the live web portfolio (Sheet 05 / 06), the `BlueprintDataService` inspects `provenance.collected_at_utc`. If the snapshot was collected within the past 24 hours, the telemetry status badge displays `LIVE_SNAPSHOT_FRESH`. If older, it displays `LIVE_SNAPSHOT_STALE`.

---

## 10. KNOWN LIMITATIONS

1. **GraphQL Contribution Calendar:** Anonymous GraphQL queries are blocked by GitHub (rate limit 0). Sheet 06 displays an audited static preview rather than live 52-week calendar heatmaps.
2. **Events Horizon:** Public events stream (`/events/public`) is capped by GitHub to a maximum 90-day rolling window or 300 events.
3. **Unauthenticated REST Rate Limit:** Unauthenticated API calls are capped at 60 requests per hour per IP. The collector consumes ~24 requests per run and enforces a safety abort threshold at >= 35 remaining units.

---

## 11. TROUBLESHOOTING INSTRUCTIONS

### Issue: Workflow failed with "API quota safety gate triggered"
- **Cause:** The runner IP had fewer than 35 quota units remaining.
- **Resolution:** Wait for the hourly quota reset (recorded in `reset_utc`). The next scheduled run at 02:17 UTC will execute with a fresh quota.

### Issue: Workflow passed but no commit was created
- **Cause:** `--only-if-changed` detected that no repositories, stars, forks, or commits changed since the previous snapshot.
- **Resolution:** This is expected, intended behavior. To force an update, trigger manual dispatch with `force_update=true`.

### Issue: Workflow failed with "Schema validation failed"
- **Cause:** A GitHub API response returned an unexpected structure or missing required property.
- **Resolution:** Inspect the Actions log output to identify the exact failing path. The production snapshot `docs/data/github-data.json` was automatically preserved.

---

## 12. FUTURE EVENT-DRIVEN SYNCHRONIZATION POSSIBILITIES

The daily schedule implemented in V1.0.1 can be augmented in future milestones:

- **Repository Dispatch Webhooks:** Triggering immediate telemetry updates when commits are pushed to other repositories under `sahasanchayan44-tech`.
- **Authenticated GraphQL Ingestion:** Utilizing an authenticated token secret to ingest 52-week contribution graphs if authenticated features are approved.
- **Automated Issue / PR Velocity Tracking:** Extending the schema to track closed PRs and release tags across personal projects.

> **Scope Boundary:** The capabilities listed in Section 12 represent future enhancements. V1.0.1 implements deterministic daily scheduled and manual `workflow_dispatch` telemetry synchronization.
