# BLUEPRINT — PHASE 4.2 FINAL IMPLEMENTATION PLAN
## Public GitHub Data Integration // Local Read-Only Prototype Architecture

**Document ID:** `SAHA-BP-PHASE04-2-FINAL-PLAN`  
**Revision:** `1.2.0 (Phase 4.2 Final Validation)`  
**Date:** `2026-11-07`  
**Developer:** Sanchayan Saha  
**Target Identity:** [`sahasanchayan44-tech`](https://github.com/sahasanchayan44-tech)  
**Workspace:** `~/Projects/BLUEPRINT`  
**Local Preview Runtime:** `http://localhost:8088/index.html`  
**Status:** **PLANNING ONLY // IMPLEMENTATION NOT AUTHORIZED (AWAITING USER GO-AHEAD)**

---

## 1. EXECUTIVE SUMMARY & VALIDATION CONTEXT

This document represents the finalized, fully reconciled implementation specification for **Phase 4: Public GitHub Data Integration**. It directly resolves the three technical issues specified in the Phase 4.2 validation mandate:

1. **Reconciliation of Historical SHA Lookups with the API Budget:** Exact endpoint-to-request mapping for all 11 milestones, identifying which are covered by base queries, establishing the exact worst-case fallback count (9 additional requests), establishing the revised worst-case total (**33 requests**), and raising the mandatory safety threshold to **$\ge 35$ remaining quota units** with an atomic abort guarantee.
2. **Total Removal of Commit Author Emails:** Complete elimination of email addresses (both raw and partially masked) from `docs/data/github-data-schema.json`, `docs/data/github-data.json`, and the DOM. Attribution is handled strictly via verified GitHub `author_login` handles when provided by GitHub's API object, with explicit disclaimers against inferring account ownership from unverified Git config strings.
3. **Exact File Paths & Architecture Non-Duplication:** Definitive inventory of the 9 required file paths, confirming zero conflicting data services and 100% preservation of all existing Sheet 01–12 modules.

---

## 2. RECONCILED API REQUEST BUDGET & HISTORICAL SHA VERIFICATION STRATEGY

### 2.1 Exact Endpoint-to-Milestone Verification Mapping

The 11 historical engineering milestones documented in [`DATA_INTEGRITY_AUDIT.md`](file:///home/sanchayan/Projects/BLUEPRINT/DATA_INTEGRITY_AUDIT.md) are verified through the following deterministic mapping:

| Log ID | Milestone Target | Commit SHA | Verification Endpoint | Base Request Coverage | Worst-Case Additional Req |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **LOG-01** | `BLUEPRINT Specification` | `LOCAL SPEC` | *Local workspace file system* | Verified locally (0 network calls) | **0** |
| **LOG-02** | `portfolio` | `3409681` | `GET /repos/sahasanchayan44-tech/portfolio/commits?per_page=5` | **Covered in Base Req #5** (Commit #1) | **0** (Fallback: 1) |
| **LOG-03** | `exam-oracle-ai` | `9c56152` | `GET /repos/sahasanchayan44-tech/exam-oracle-ai/commits?per_page=5` | **Covered in Base Req #6** (Commit #1) | **0** (Fallback: 1) |
| **LOG-04** | `neuroverse` | `f150e42` | `GET /repos/sahasanchayan44-tech/neuroverse/commits?per_page=5` | **Covered in Base Req #7** (Commit #1) | **0** (Fallback: 1) |
| **LOG-05** | `chandrayaan-4.0` | `a3bf025` | `GET /repos/sahasanchayan44-tech/chandrayaan-4.0/commits?per_page=5` | **Covered in Base Req #8** (Commit #1) | **0** (Fallback: 1) |
| **LOG-06** | `sunapse-android` | `304876e` | `GET /repos/sahasanchayan44-tech/sunapse-android/commits?per_page=5` | **Covered in Base Req #9** (Commit #1) | **0** (Fallback: 1) |
| **LOG-07** | `admin-panel` | `34909cc` | `GET /repos/sahasanchayan44-tech/admin-panel/commits?per_page=5` | **Covered in Base Req #10** (Commit #1) | **0** (Fallback: 1) |
| **LOG-08** | `study-manager` | `854d01a` | `GET /repos/sahasanchayan44-tech/study-manager/commits?per_page=5` | **Covered in Base Req #11** (Commit #1) | **0** (Fallback: 1) |
| **LOG-09** | `synapse` | `119369b` | `GET /repos/sahasanchayan44-tech/synapse/commits?per_page=5` | **Covered in Base Req #12** (Commit #1) | **0** (Fallback: 1) |
| **LOG-10** | `aria` | `17f670e` | `GET /repos/sahasanchayan44-tech/aria/commits?per_page=5` | **Covered in Base Req #13** (Commit #1) | **0** (Fallback: 1) |
| **LOG-11** | `Account Inception` | `API: 268472249` | `GET /users/sahasanchayan44-tech` | **Covered in Base Req #1** (`.created_at`) | **0** |

### 2.2 Analysis of Base Coverage vs Fallback Lookups
- **Current Baseline:** LOG-01 is a local file. LOG-11 is verified by the user profile endpoint. The remaining 9 milestones (LOG-02 through LOG-10) are currently the HEAD commits or within the latest 5 commits of their respective repositories. Therefore, during standard execution, **all 9 commits are retrieved by the base commit queries with 0 additional requests**.
- **Maximum Possible Additional Lookups:** If subsequent commits are pushed to all 9 repositories such that every milestone falls outside the latest 5 commits, the collector must query each SHA individually via `GET /repos/sahasanchayan44-tech/{repo}/commits/{commit_sha}`. The maximum possible additional requests is strictly **9 requests**.

### 2.3 Revised Worst-Case Request Calculation
```
================================================================================
REVISED WORST-CASE INGESTION REQUEST BUDGET
================================================================================
1. Pre-flight Rate Limit Diagnostic (GET /rate_limit)      :  0 core quota units
2. Primary User Profile (GET /users/sahasanchayan44-tech)  :  1 request
3. Public Repository List (GET /users/.../repos?per_page=100): 1 request
4. Public Events Stream (GET /users/.../events/public?...) :  1 request
5. Language Distributions (GET /repos/.../languages x 9)   :  9 requests
6. Recent Repository Commits (GET /repos/.../commits x 9)  :  9 requests
--------------------------------------------------------------------------------
Base Synchronous Ingestion Subtotal                        : 21 requests
7. Maximum Fallback Dedicated SHA Lookups (9 repos x 1)    :  9 requests
8. Transient Retry Buffer (HTTP 5xx / timeout, max 1 retry):  3 requests
================================================================================
ABSOLUTE MAXIMUM WORST-CASE REQUEST COUNT                  : 33 requests
================================================================================
```

### 2.4 Revised Safety Threshold & Abort Protocol
With an unauthenticated rate limit of 60 requests/hour and a worst-case requirement of 33 requests:
1. **Mandatory Pre-Flight Quota Gate:**
   - The collector invokes `GET /rate_limit` before generating any data requests.
   - **Safety Threshold Rule:** If `x-ratelimit-remaining < 35`, the collector **refuses to run** and immediately exits with code 1.
   - *Rationale:* A threshold of 35 guarantees that even in the absolute worst-case scenario (all 9 historical SHAs require individual queries AND 3 retries occur), the total consumption of 33 requests will leave at least 2 requests to spare, completely eliminating any risk of IP-level 403 lockouts.
2. **Never Silently Skip Verification:**
   - The collector will **never** silently omit historical SHA verification to stay within quota.
   - If `x-ratelimit-remaining` drops below the required count during execution, the script triggers an **Atomic Abort**:
     - Deletes the temporary file `docs/data/github-data.json.tmp`.
     - Preserves the existing `docs/data/github-data.json` intact.
     - Logs the exact shortfall and reset time:
       ```
       [ABORT] API quota exhausted during historical verification.
       Required: 35 | Remaining: ${remaining}. Reset scheduled at: ${resetTimeUtc}.
       Existing verified snapshot preserved. No partial data written.
       ```

---

## 3. COMMIT EMAIL PRIVACY POLICY & IDENTITY INTEGRITY

### 3.1 Total Elimination of Personal Email Addresses
In accordance with user instructions, **email addresses are completely excluded** from the application:
- **No Raw Emails:** Raw commit author emails (`sahasanchayan44@gmail.com`) are never written to disk or rendered.
- **No Masked Emails:** Masked email formats (`sa***44@gmail.com`) are also **completely omitted**.
- **Schema Enforcement:** The fields `author_email` and `masked_email` are removed from `docs/data/github-data-schema.json`.

### 3.2 Account Ownership & Committer Identity Invariant
Git commit metadata permits arbitrary author strings in local `.gitconfig`. Therefore:
- The system will **never infer** that an author name (e.g. `"Sanchayan Saha"`) proves ownership of the GitHub account.
- **Author Identity Field (`author_login`):** Populated **strictly** from GitHub's verified API user object (`item.author.login`), which is only present when GitHub cryptographically or email-associates the commit with an authenticated GitHub user account.
- If `item.author` is `null` (e.g. unlinked local commit), the field is stored as `null`, and the UI displays `UNLINKED GIT COMMITTER`.

### 3.3 Preserved Milestone Data Fields
For each milestone and recent commit, only verifiable technical fields are stored:
- `commit_sha`: Full SHA and 7-character short SHA.
- `repository`: Repository namespace (e.g. `sahasanchayan44-tech/portfolio`).
- `commit_url`: Direct permalink to GitHub commit page.
- `committed_at`: ISO 8601 UTC timestamp.
- `message`: Commit message string.
- `author_login`: GitHub account handle (or `null` if unlinked).
- `verification_status`: Cryptographic/provenance verification state.

---

## 4. FINAL NULLABLE JSON SCHEMA

### File: `docs/data/github-data-schema.json`
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BlueprintPublicGitHubDataSchema",
  "type": "object",
  "required": ["provenance", "user", "telemetry", "repositories", "historical_milestones", "limitations"],
  "properties": {
    "provenance": {
      "type": "object",
      "required": ["collected_at_utc", "collector_version", "access_mode", "rate_limit_snapshot"],
      "properties": {
        "collected_at_utc": { "type": "string", "format": "date-time" },
        "collector_version": { "type": "string" },
        "access_mode": { "type": "string", "enum": ["UNAUTHENTICATED_PUBLIC_REST"] },
        "primary_source": { "type": "string" },
        "rate_limit_snapshot": {
          "type": "object",
          "required": ["limit", "remaining", "reset_utc", "used"],
          "properties": {
            "limit": { "type": "integer" },
            "remaining": { "type": "integer" },
            "reset_utc": { "type": "string", "format": "date-time" },
            "used": { "type": "integer" }
          }
        }
      }
    },
    "user": {
      "type": "object",
      "required": ["login", "id", "created_at", "public_repos", "followers", "following", "public_gists"],
      "properties": {
        "login": { "type": "string" },
        "id": { "type": "integer" },
        "created_at": { "type": "string", "format": "date-time" },
        "updated_at": { "type": ["string", "null"] },
        "public_repos": { "type": "integer", "minimum": 0 },
        "followers": { "type": "integer", "minimum": 0 },
        "following": { "type": "integer", "minimum": 0 },
        "public_gists": { "type": "integer", "minimum": 0 },
        "html_url": { "type": "string", "format": "uri" }
      }
    },
    "telemetry": {
      "type": "object",
      "required": ["total_stars", "total_forks", "account_age_days", "public_events_90d_count"],
      "properties": {
        "total_stars": { "type": "integer", "minimum": 0 },
        "total_forks": { "type": "integer", "minimum": 0 },
        "account_age_days": { "type": "integer", "minimum": 0 },
        "primary_ecosystems": { "type": "array", "items": { "type": "string" } },
        "public_events_90d_count": { "type": "integer", "minimum": 0 }
      }
    },
    "repositories": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "repo_url", "default_branch", "stars", "forks"],
        "properties": {
          "name": { "type": "string" },
          "project_id": { "type": "string" },
          "category": { "type": "string" },
          "primary_language": { "type": ["string", "null"] },
          "languages": { 
            "type": ["object", "null"],
            "additionalProperties": { "type": "integer" }
          },
          "stars": { "type": "integer", "minimum": 0 },
          "forks": { "type": "integer", "minimum": 0 },
          "default_branch": { "type": "string" },
          "created_at": { "type": ["string", "null"] },
          "updated_at": { "type": ["string", "null"] },
          "pushed_at": { "type": ["string", "null"] },
          "repo_url": { "type": "string", "format": "uri" },
          "api_description": { "type": ["string", "null"] },
          "architectural_description": { "type": "string" },
          "architecture": { "type": "string" },
          "key_components": { "type": "array", "items": { "type": "string" } },
          "provenance": {
            "type": "object",
            "properties": {
              "metadata_source": { "type": "string" },
              "architecture_source": { "type": "string" }
            }
          }
        }
      }
    },
    "historical_milestones": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["log_id", "timestamp_display", "repository", "commit_sha", "message", "verification_status"],
        "properties": {
          "log_id": { "type": "string" },
          "timestamp_display": { "type": "string" },
          "timestamp_iso": { "type": ["string", "null"] },
          "repository": { "type": "string" },
          "commit_sha": { "type": "string" },
          "commit_url": { "type": ["string", "null"] },
          "author_login": { "type": ["string", "null"] },
          "message": { "type": "string" },
          "verification_status": { "type": "string" }
        }
      }
    },
    "recent_repository_commits": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["repository", "commit_sha", "message", "committed_at"],
        "properties": {
          "repository": { "type": "string" },
          "commit_sha": { "type": "string" },
          "commit_url": { "type": "string" },
          "author_login": { "type": ["string", "null"] },
          "message": { "type": "string" },
          "committed_at": { "type": "string" }
        }
      }
    },
    "limitations": {
      "type": "object",
      "required": ["contribution_calendar", "events_window", "graphql_access", "rate_limit_policy"],
      "properties": {
        "contribution_calendar": { "type": "string" },
        "events_window": { "type": "string" },
        "graphql_access": { "type": "string" },
        "rate_limit_policy": { "type": "string" }
      }
    }
  }
}
```

---

## 5. EXACT UNAMBIGUOUS FILE INVENTORY & PRESERVATION GUARANTEE

| Relative File Path | Planned Action | Component Scope & Invariants |
| :--- | :---: | :--- |
| `scripts/fetch-public-github-data.js` | **CREATE** | Node.js ingestion collector. Pre-flight rate gate ($\ge 35$), throttled REST querying (100ms delay), zero-email normalization, atomic temp-file write & rename. |
| `docs/data/github-data-schema.json` | **CREATE** | Formal Draft-07 JSON schema. Eliminates email fields; enforces nullable types and dual-dataset separation. |
| `docs/data/github-data.json` | **CREATE** | Source-backed public snapshot written atomically by ingestion script. |
| `docs/js/data-service.js` | **CREATE** | Single browser runtime data module. Performs single local `fetch('data/github-data.json')`, verifies schema, falls back to embedded audited baseline, dispatches `blueprint:data-ready`. |
| `docs/index.html` | **MODIFY** | Includes `<script src="js/data-service.js"></script>` before `interactivity.js`. Adds Sheet 12 provenance telemetry panel and Sheet 04/05 provenance badges. |
| `docs/js/interactivity.js` | **MODIFY** | Binds to `window.BlueprintDataService`. Hydrates Sheet 04 (Explorer), Sheet 05 (Telemetry), Sheet 10 (Logbook), and Sheet 12 (Freshness/Quota) while preserving all existing filters, sorting, and focus-trapped modals. |
| `docs/css/interactivity.css` | **MODIFY** | Minimal styles for Sheet 12 provenance panel, rate limit meter bar, and freshness status chips. |
| `tests/phase-4-audit.js` | **CREATE** | Automated headless Chrome verification suite via CDP covering 16 test suites. |
| `PHASE_4_EXECUTION_REPORT.md` | **CREATE** | Post-implementation execution report detailing audit outcomes, verified endpoints, and screenshots. |

### Confirmation of Preserved Codebase Integrity
- **No Conflicting Data Services:** Only one data service module (`docs/js/data-service.js`) will exist.
- **Preserved Core Files:** All existing stylesheets (`blueprint-theme.css`, `engineering-grid.css`, `components.css`, `sheet-01.css`, `sheets-batch-a.css`, `sheets-batch-b.css`, `sheets-batch-c.css`), navigation engine (`docs/js/navigation.js`), master initialization (`docs/js/app.js`), and existing audit suites remain 100% active and uncorrupted.

---

## 6. REFRESH ARCHITECTURE & ATOMIC SNAPSHOT MANAGEMENT

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Local CLI)
    participant Script as scripts/fetch-public-github-data.js
    participant GH as GitHub Public API
    participant FS as Local File System (docs/data/)
    participant Browser as Browser Client (docs/index.html)
    participant Service as docs/js/data-service.js

    Note over Dev,FS: OPERATION 1: LOCAL CLI INGESTION (ON-DEMAND)
    Dev->>Script: Run: node scripts/fetch-public-github-data.js
    Script->>GH: GET /rate_limit
    GH-->>Script: Rate limit status (e.g. 54 / 60 remaining)
    alt Remaining < 35
        Script-->>Dev: ATOMIC ABORT: Insufficient quota (< 35). Existing snapshot untouched.
    else Remaining >= 35
        Script->>GH: Fetch profile, repos, languages, recent commits (100ms throttle)
        GH-->>Script: Public JSON payloads
        Script->>Script: Verify 11 milestones; query missing SHAs if necessary
        Script->>Script: Strip all emails; extract verified author_login
        Script->>Script: Validate against github-data-schema.json
        Script->>FS: Write docs/data/github-data.json.tmp
        Script->>FS: Atomic fs.renameSync(.tmp -> github-data.json)
        Script-->>Dev: SUCCESS: Validated snapshot updated atomically.
    end

    Note over Browser,Service: OPERATION 2: BROWSER RUNTIME LOADING (LOCAL-ONLY)
    Browser->>Service: Boot data-service.js on page load
    Service->>FS: Single local fetch('data/github-data.json')
    Note over Service,GH: Browser NEVER calls api.github.com directly
    alt Local JSON Loaded Successfully
        Service->>Service: Compute freshness (Date.now() - collected_at_utc)
        Service-->>Browser: Hydrate Sheets 04, 05, 10, 12 from local snapshot
    else Fetch Failed (Offline / CORS file origin)
        Service-->>Browser: Fall back to embedded audited baseline. Status: OFFLINE.
    end
```

### Cache Freshness States on Sheet 12:
- **$\Delta t < 24$ Hours:** `[ SOURCE: LOCAL SNAPSHOT // FRESH (< 24H) ]`
- **$\Delta t \ge 24$ Hours:** `[ SOURCE: LOCAL SNAPSHOT // STALE (> 24H) — CLI REFRESH RECOMMENDED ]`
- **Offline / Fallback:** `[ SOURCE: STANDALONE AUDITED BASELINE // OFFLINE ]`

---

## 7. CONTRIBUTION DATA TERMINOLOGY & HONEST REPORTING

1. **Sheet 06 Heatmap Warning Preservation:**
   - The banner will remain permanently visible:
     `[ STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA ]`
     `52-WEEK COMMIT HEATMAP MATRIX ARCHITECTURE // SIMULATION PREVIEW`
   - CAD grid subtitle:
     `ANNUAL COMMIT HEATMAP MATRIX // CAD GRID [STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA]`
2. **Strict Terminology Invariant:**
   - **Public Events:** Activity recorded from `/users/sahasanchayan44-tech/events/public` is strictly labelled:
     `PUBLIC ACTIVITY STREAM // 90-DAY ROLLING WINDOW (2 RECORDED EVENTS)`
     *(Never labelled as "Contributions" or "Contribution Calendar")*.
   - **Repository Commits:** Commit statistics gathered from `/repos/.../commits` are strictly labelled:
     `REPOSITORY COMMIT RECORDS // PUBLIC GIT TREES`
     *(Never equated to personal contribution totals)*.
   - **GraphQL Limitation Notice:** Sheet 06 and Sheet 12 explicitly note:
     `FULL 52-WEEK CONTRIBUTION CALENDAR REQUIRES AUTHENTICATED GRAPHQL PIPELINE (ANONYMOUS ACCESS RESTRICTED BY GITHUB // LIMIT: 0)`.

---

## 8. AUTOMATED TESTING PLAN (16 VERIFICATION SUITES)

[`tests/phase-4-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-4-audit.js) will execute via headless Chrome over CDP:

1. **Schema Strict Validation:** Validate `docs/data/github-data.json` against `github-data-schema.json`.
2. **Quota Safety Threshold Assertion:** Verify collector aborts when quota is simulated below 35.
3. **Data Provenance Verification:** Verify `collected_at_utc` format, `access_mode === 'UNAUTHENTICATED_PUBLIC_REST'`, and rate-limit snapshot.
4. **Historical Logbook Immutability:** Assert all 11 audited milestones are present with exact SHAs, correct chronological sequence, and zero overwritten entries.
5. **Recent Commits Separation:** Verify dynamic recent commits reside in `recent_repository_commits` without contaminating `historical_milestones`.
6. **Zero-Email Privacy Assertion:** Assert **zero** email addresses (raw or masked) exist in `docs/data/github-data.json` or any DOM element.
7. **Nullable Field Resilience:** Ingest mock repository with `description: null` and `language: null`; verify dossier boots cleanly with zero errors.
8. **Account Telemetry Reconcile:** Verify account-level metrics match public API (`public_repos: 9`, `followers: 0`, `following: 2`, `public_gists: 0`).
9. **Repository Telemetry Aggregation:** Verify `total_stars: 2` and `total_forks: 2` aggregated accurately.
10. **Zero External Browser Requests:** Intercept network requests in CDP during page load; assert **zero** calls made to `api.github.com`.
11. **Offline / Fallback Resilience:** Simulate network failure; verify application seamlessly falls back to embedded baseline with visible offline badge.
12. **Sheet 04 Dynamic Explorer:** Verify instant repo search and language/category filters work identically on hydrated data.
13. **Sheet 04 Modal Focus Trap Regression:** Verify Enter opens modal, focus lands on `#modal-close-btn`, Tab wraps cyclically, Shift+Tab wraps cyclically, Escape restores focus to card.
14. **Sheet 06 Static Preview Warning Assertion:** Assert explicit presence of `[ STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA ]`.
15. **Responsive Zero-Overflow Regression:** Verify all 12 sheets across 5 viewports (1920, 1440, 768, 390, 320) maintain 0px horizontal document overflow.
16. **Zero Browser Console Errors:** Assert `0` uncaught runtime exceptions across all tests.

---

## 9. FINAL ESTIMATED IMPLEMENTATION SEQUENCE (UPON AUTHORIZATION)

```
[ STEP 1 ] Create docs/data/github-data-schema.json (Draft-07 zero-email nullable schema)
[ STEP 2 ] Create scripts/fetch-public-github-data.js (quota threshold >= 35, 100ms throttle, atomic rename)
[ STEP 3 ] Execute node scripts/fetch-public-github-data.js to generate initial docs/data/github-data.json
[ STEP 4 ] Create docs/js/data-service.js (offline-first single-fetch loader & fallback bus)
[ STEP 5 ] Update docs/index.html to include data-service.js and Sheet 12 provenance telemetry panel
[ STEP 6 ] Update docs/js/interactivity.js to hydrate from BlueprintDataService
[ STEP 7 ] Update docs/css/interactivity.css for provenance chips & quota meter styling
[ STEP 8 ] Implement tests/phase-4-audit.js (16 automated verification suites)
[ STEP 9 ] Execute automated audit & capture fresh desktop and mobile screenshots
[ STEP 10] Produce PHASE_4_EXECUTION_REPORT.md and HALT for user review
```

---

> [!IMPORTANT]
> **MANDATORY STOP — PHASE 4.2 PLANNING ONLY // IMPLEMENTATION NOT AUTHORIZED.**  
> In strict compliance with instructions:
> - Zero application source files were edited.
> - Zero implementation scripts were executed.
> - Zero external API mutations or git commits were generated.
> - Work is halted.
>
> **Awaiting your explicit authorization to begin Phase 4 implementation.**
