# BLUEPRINT — PHASE 6.0.2 REMEDIATION SPECIFICATION
## Automated GitHub Synchronization Architecture Remediation

**Document Reference**: `SAHA-BP-2026-01-PHASE-6.0.2`  
**Target Profile**: Sanchayan Saha (`sahasanchayan44-tech` // User ID: `268472249`)  
**Specification Reference**: `PHASE_6_0_TECHNICAL_DESIGN.md` & `PHASE_6_0_1_ARCHITECTURE_VERIFICATION.md`  
**Mode**: PLANNING & ARCHITECTURAL SPECIFICATION ONLY (NO IMPLEMENTATION)  
**Status**: APPROVED REMEDIATION SPECIFICATION // IMPLEMENTATION READY  
**Author**: Antigravity (Advanced Agentic Architecture Group)  
**Timestamp**: 2026-11-08T10:50:00+05:30  

---

## 1. OBJECTIVE & REMEDIATION SCOPE

This specification provides the authoritative, implementation-ready remediation blueprint resolving discrepancies **D-01 through D-09** identified in the Phase 6.0.1 technical audit.

All corrections preserve the previously accepted 12-sheet dossier architecture, the custom Indic-inspired Latin typography, the calibrated content invariants (zero email exposure, unverified license status, snapshot telemetry), and the strict isolation boundaries.

---

## 2. DETAILED REMEDIATION SPECIFICATIONS (D-01 THROUGH D-09)

### 2.1 Remediation D-01: GitHub Actions Decoupled Two-Job Workflow Topology

#### Defect Analysis:
In GitHub Actions syntax, `permissions` cannot be defined inside a `step`. Attempting to place `permissions: contents: write` within a step causes immediate runner syntax parsing failure.

#### Architectural Specification:
Restructure `.github/workflows/sync-blueprint.yml` into two decoupled, sequentially dependent jobs with artifact-based data passing:

```yaml
name: "BLUEPRINT Automated GitHub Synchronization"

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
    inputs:
      force_refresh:
        description: 'Force full reconciliation ignoring cache'
        required: false
        type: boolean
        default: false

concurrency:
  group: blueprint-sync-engine
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  # -------------------------------------------------------------------------
  # JOB 1: UNPRIVILEGED INGESTION, VALIDATION & SURFACE REGENERATION
  # -------------------------------------------------------------------------
  ingest-validate-generate:
    name: "Ingest, Validate & Generate Surfaces"
    runs-on: ubuntu-latest
    permissions:
      contents: read
    outputs:
      changes_detected: ${{ steps.git_diff.outputs.changes_detected }}
    steps:
      - name: "Checkout Codebase"
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: "Setup Node.js Runtime"
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: "Execute GitHub Sync & Schema Validation"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          node scripts/sync-github-data.js

      - name: "Regenerate Profile Surfaces"
        run: |
          node scripts/generate-profile-readme.js
          node scripts/generate-profile-svg.js

      - name: "Execute Failure-Injection & Dynamic Regression Suites"
        run: |
          node tests/hardening-failure-injection.js
          node tests/phase-6-sync-audit.js

      - name: "Evaluate Working Tree Dirty State"
        id: git_diff
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "changes_detected=true" >> $GITHUB_OUTPUT
            echo "✓ Changes detected across synchronized surfaces."
          else
            echo "changes_detected=false" >> $GITHUB_OUTPUT
            echo "✓ Snapshot and surfaces are up to date. Zero changes."
          fi

      - name: "Stage Synced Surfaces Artifact"
        if: steps.git_diff.outputs.changes_detected == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: blueprint-synced-surfaces
          path: |
            docs/data/github-data.json
            docs/data/github-data.prev.json
            assets/profile/blueprint-metrics.svg
            README.md
          retention-days: 1
          overwrite: true

  # -------------------------------------------------------------------------
  # JOB 2: PRIVILEGED PUBLISHING (TRIGGERED ONLY ON VALID DIRTY TREE)
  # -------------------------------------------------------------------------
  publish-surfaces:
    name: "Publish Updated Surfaces"
    needs: ingest-validate-generate
    if: needs.ingest-validate-generate.outputs.changes_detected == 'true' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: "Checkout Main Branch"
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: "Download Verified Synced Artifacts"
        uses: actions/download-artifact@v4
        with:
          name: blueprint-synced-surfaces

      - name: "Commit & Push Updated Surfaces (Least Privilege)"
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add docs/data/github-data.json docs/data/github-data.prev.json assets/profile/blueprint-metrics.svg README.md
          git commit -m "chore(sync): automated snapshot & surface synchronization [skip ci]"
          git push origin main
```

#### Acceptance Criteria for D-01:
- [ ] Workflow YAML parses with zero syntax errors under GitHub Actions schema validation.
- [ ] Ingestion job executes with strictly read-only token permissions.
- [ ] Publishing job executes only if changes are detected on `refs/heads/main`.
- [ ] Artifact upload/download securely transfers only the 4 specified surface files.
- [ ] Commits are authored by GitHub Actions bot and tagged with `[skip ci]`.

---

### 2.2 Remediation D-02: Dynamic Synchronization Test Harness & Suite Separation

#### Defect Analysis:
[`tests/phase-5-2-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-5-2-audit.js) asserts frozen static integers (`repos === 9`, `2 Stars`, `38 Commits`). Any automated repository addition or star update will fail this test.

#### Architectural Specification:
1. **Preserve Phase 5.2 Suite Intact**:
   - `tests/phase-5-2-audit.js` remains permanently untouched as the historical calibration baseline for the initial 2026-11-08 snapshot.
2. **Implement Dedicated Dynamic Sync Suite (`tests/phase-6-sync-audit.js`)**:
   - Compares generated surfaces dynamically against the active `docs/data/github-data.json`:
     ```javascript
     const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
     const expectedReposCount = snapshot.repositories.length;
     const expectedStars = snapshot.telemetry.total_stars;
     const expectedForks = snapshot.telemetry.total_forks;
     const expectedEcosystems = snapshot.telemetry.primary_ecosystems.length;

     // Parity Assertions
     assert(readmeContent.includes(String(expectedReposCount).padStart(2, '0')), 'README reflects active repo count');
     assert(readmeContent.includes(String(expectedStars).padStart(2, '0') + ' Stars'), 'README reflects active stars');
     assert(svgContent.includes(`id="metric-val-repos">${String(expectedReposCount).padStart(2, '0')}<`), 'SVG reflects active repo count');
     ```
   - Retains all negative claim integrity assertions:
     - `assert(!readmeContent.includes('92%'))`
     - `assert(!readmeContent.includes('Production-Grade Engineering'))`
     - `assert(!readmeContent.includes('100% of the 9 public repositories above are strictly open-source'))`
     - `assert(emailMatches.length === 0)`

#### Acceptance Criteria for D-02:
- [ ] `tests/phase-5-2-audit.js` remains unmodified and runnable.
- [ ] `tests/phase-6-sync-audit.js` passes dynamically against any arbitrary valid snapshot (e.g. 10 repos, 5 stars) without hardcoded count failures.
- [ ] Negative assertions prevent re-introduction of unverified claims.

---

### 2.3 Remediation D-03: Backward-Compatible Schema v1.3.0 & Migration Strategy

#### Defect Analysis:
Adding `"schema_version"` and `"sync_metadata"` as required properties in `docs/data/github-data-schema.json` breaks legacy fixtures and `FALLBACK_BASELINE` in [`docs/js/data-service.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/data-service.js).

#### Architectural Specification:
1. **Schema v1.3.0 Definition**:
   - The top-level `required` array retains the original 7 properties:
     `["provenance", "user", "telemetry", "repositories", "historical_milestones", "recent_repository_commits", "limitations"]`.
   - `"schema_version"` is added as an **optional** string property:
     ```json
     "schema_version": {
       "type": "string",
       "enum": ["1.2.0", "1.3.0"],
       "default": "1.3.0"
     }
     ```
   - `"sync_metadata"` is added as an **optional** object property.
   - In `repositories.items`, `"license_status"` is added with default `"Unverified / Unspecified"`.
2. **Fallback Baseline Synchronization**:
   - Add `"schema_version": "1.3.0"` to `FALLBACK_BASELINE` in `docs/js/data-service.js`.
3. **Migration Fixture Tests**:
   - Add test fixtures in `tests/hardening-failure-injection.js` verifying that:
     - A legacy payload (lacking `schema_version` and `sync_metadata`) passes validation.
     - A v1.3.0 payload (containing `schema_version` and `sync_metadata`) passes validation.

#### Acceptance Criteria for D-03:
- [ ] `docs/data/github-data-schema.json` accepts both legacy v1.2.0 and modern v1.3.0 snapshots.
- [ ] `FALLBACK_BASELINE` in `docs/js/data-service.js` conforms to the schema.
- [ ] Failure-injection suite passes for all legacy and v1.3.0 fixtures.

---

### 2.4 Remediation D-04: In-Flight Quota Safety Gate & Request-Level Abort

#### Defect Analysis:
The existing collector checked quota only at pre-flight. An initial quota of 36 passed pre-flight but depleted down to 15 during execution, breaching the 35-unit safety floor.

#### Architectural Specification:
Implement a two-tier quota safety mechanism in `scripts/sync-github-data.js`:

```javascript
class QuotaExhaustionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QuotaExhaustionError';
  }
}

// Inside GitHubCollector:
async runPreFlightCheck() {
  const rateData = await this.makeRequest('/rate_limit');
  const remaining = rateData.rate.remaining;
  const limit = rateData.rate.limit;
  const requiredMinimum = MIN_QUOTA_SAFETY_THRESHOLD + ESTIMATED_RUN_REQUESTS; // 35 + 21 = 56

  if (remaining < requiredMinimum && this.accessMode === 'UNAUTHENTICATED') {
    console.warn(`[QUOTA PRE-FLIGHT] Quota (${remaining}) insufficient to guarantee >= ${MIN_QUOTA_SAFETY_THRESHOLD} post-run. Aborting cleanly.`);
    this.quotaAborted = true;
    return false;
  }
  return true;
}

// Inside makeRequest(endpoint):
if (res.headers['x-ratelimit-remaining']) {
  this.lastRemaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
  if (this.lastRemaining < MIN_QUOTA_SAFETY_THRESHOLD) {
    throw new QuotaExhaustionError(
      `[IN-FLIGHT QUOTA SAFETY GATE] In-flight quota dropped to ${this.lastRemaining} (below safety floor ${MIN_QUOTA_SAFETY_THRESHOLD}). Halting execution immediately.`
    );
  }
}
```

#### Acceptance Criteria for D-04:
- [ ] Pre-flight aborts if unauthenticated quota is $< 56$.
- [ ] `makeRequest()` throws `QuotaExhaustionError` immediately if remaining quota drops below 35 at any point during execution.
- [ ] When quota abort occurs, active snapshot is preserved and `.tmp` file is unlinked.

---

### 2.5 Remediation D-05: Unauthenticated Budget Capping vs Authenticated Reconciliation

#### Defect Analysis:
Querying all releases, tags, and milestone SHAs individually exceeds the 60-request/hr unauthenticated limit.

#### Architectural Specification:
1. **Unauthenticated Execution Profile (`MAX_REQUESTS = 21`)**:
   - `GET /users/sahasanchayan44-tech` (1)
   - `GET /users/sahasanchayan44-tech/repos?per_page=100` (1, page 1 only)
   - `GET /users/sahasanchayan44-tech/events/public?per_page=100` (1, page 1 only)
   - `GET /repos/{owner}/{repo}/languages` ($N$, max 9)
   - `GET /repos/{owner}/{repo}/commits?per_page=5` ($N$, max 9)
   - Milestone verification is performed in-memory against the returned 5-commit arrays. No individual commit SHA queries are dispatched.
   - Global retry budget is capped at 3 retries maximum across the entire run.
2. **Authenticated Execution Profile (`MAX_REQUESTS = 60`)**:
   - Dispatched when `process.env.GITHUB_TOKEN` is present.
   - Performs milestone verification across full repository history where required.

#### Acceptance Criteria for D-05:
- [ ] Unauthenticated runs never dispatch more than 24 requests under any condition (including retries).
- [ ] No per-milestone SHA requests are dispatched during unauthenticated runs.
- [ ] Authenticated runs execute within the 1,000-request GitHub Actions rate limit.

---

### 2.6 Remediation D-06: SVG Dynamic Text Updates via Explicit XML Element IDs

#### Defect Analysis:
Naive string replacement on numeric tokens (`"09"`) risks corrupting coordinates or attributes in `assets/profile/blueprint-metrics.svg`.

#### Architectural Specification:
1. **Assign Explicit XML IDs in `assets/profile/blueprint-metrics.svg`**:
   ```xml
   <!-- Repositories Value -->
   <text id="metric-val-repos" x="32" y="86" class="tech-mono cad-val">09</text>

   <!-- Engagement Stars & Forks Value -->
   <text id="metric-val-engagement" x="264" y="86" class="tech-mono cad-val-cyan" font-size="20px">02 <tspan font-size="11px" fill="#8EA3C4">STARS</tspan>  02 <tspan font-size="11px" fill="#8EA3C4">FORKS</tspan></text>

   <!-- Primary Ecosystems Count -->
   <text id="metric-val-ecosystems" x="496" y="86" class="tech-mono cad-val">05</text>

   <!-- Validation Engine Indicator -->
   <text id="metric-val-schema" x="728" y="86" class="tech-mono cad-val" font-size="20px">DRAFT-07</text>
   ```
2. **Generator Logic in `scripts/generate-profile-svg.js`**:
   - Uses regex anchored strictly to the element IDs:
     ```javascript
     svg = svg.replace(/(<text[^>]*id="metric-val-repos"[^>]*>)([\s\S]*?)(<\/text>)/, `$1${repoCount}$3`);
     svg = svg.replace(/(<text[^>]*id="metric-val-engagement"[^>]*>)([\s\S]*?)(<\/text>)/, `$1${starsForksFormatted}$3`);
     svg = svg.replace(/(<text[^>]*id="metric-val-ecosystems"[^>]*>)([\s\S]*?)(<\/text>)/, `$1${ecosystemsCount}$3`);
     ```
   - Validates resulting XML tree via Python `xml.etree.ElementTree`.
   - Asserts viewBox remains `0 0 960 140` and dimensions are intact.

#### Acceptance Criteria for D-06:
- [ ] All 4 metric cells in `blueprint-metrics.svg` have explicit `id` attributes.
- [ ] SVG generator replaces text exclusively inside elements matching those IDs.
- [ ] SVG passes `xml.etree.ElementTree` parsing and viewBox assertions.

---

### 2.7 Remediation D-07: Snapshot Rollback, Recovery & Client Resilience

#### Defect Analysis:
If `docs/data/github-data.json` is missing or corrupted, the client data service currently bypasses `github-data.prev.json` and loads the static baseline.

#### Architectural Specification:
1. **Snapshot Backup in Collector**:
   - Before executing atomic swap, copy active `docs/data/github-data.json` to `docs/data/github-data.prev.json`.
2. **Two-Tier Fallback in `docs/js/data-service.js`**:
   ```javascript
   function init() {
     initPromise = loadData('data/github-data.json')
       .catch(err => {
         console.warn('[DATA SERVICE] Primary snapshot unavailable. Attempting previous snapshot (data/github-data.prev.json)...', err.message);
         return loadData('data/github-data.prev.json')
           .then(data => {
             activeStatus = 'PREVIOUS_SNAPSHOT_RECOVERED';
             return data;
           });
       })
       .catch(err => {
         console.warn('[DATA SERVICE] Previous snapshot unavailable. Activating offline baseline...', err.message);
         activeData = FALLBACK_BASELINE;
         activeStatus = 'OFFLINE_FALLBACK';
         return activeData;
       });
     return initPromise;
   }
   ```

#### Acceptance Criteria for D-07:
- [ ] `docs/data/github-data.prev.json` is maintained on every successful sync.
- [ ] If `github-data.json` is deleted or corrupted, website seamlessly loads `github-data.prev.json`.
- [ ] If both are deleted, website falls back to `FALLBACK_BASELINE` with zero DOM errors.

---

### 2.8 Remediation D-08: README Sentinels: Cardinality, Sequence & Safe Abort

#### Defect Analysis:
Missing, duplicate, or out-of-order sentinel comments could lead to truncated documents or overwritten curated content.

#### Architectural Specification:
Implement strict sentinel validation in `scripts/generate-profile-readme.js`:

```javascript
const SENTINEL_PAIRS = [
  { start: '<!-- BLUEPRINT_METRICS_CARD:START -->', end: '<!-- BLUEPRINT_METRICS_CARD:END -->' },
  { start: '<!-- BLUEPRINT_PROJECT_REGISTRY:START -->', end: '<!-- BLUEPRINT_PROJECT_REGISTRY:END -->' },
  { start: '<!-- BLUEPRINT_TELEMETRY_TABLE:START -->', end: '<!-- BLUEPRINT_TELEMETRY_TABLE:END -->' },
  { start: '<!-- BLUEPRINT_METADATA_FOOTER:START -->', end: '<!-- BLUEPRINT_METADATA_FOOTER:END -->' }
];

function validateReadmeSentinels(readmeText) {
  let lastIndex = -1;
  for (const pair of SENTINEL_PAIRS) {
    const startMatches = (readmeText.match(new RegExp(escapeRegExp(pair.start), 'g')) || []).length;
    const endMatches = (readmeText.match(new RegExp(escapeRegExp(pair.end), 'g')) || []).length;

    if (startMatches !== 1 || endMatches !== 1) {
      throw new Error(`[SENTINEL CARDINALITY ERROR] Tag '${pair.start}' count: ${startMatches}, '${pair.end}' count: ${endMatches} (expected exactly 1).`);
    }

    const startIndex = readmeText.indexOf(pair.start);
    const endIndex = readmeText.indexOf(pair.end);

    if (startIndex <= lastIndex || endIndex <= startIndex) {
      throw new Error(`[SENTINEL ORDER ERROR] Sentinel pair '${pair.start}' is out of order.`);
    }
    lastIndex = endIndex;
  }
}
```

#### Acceptance Criteria for D-08:
- [ ] Generator aborts with a clear error if any sentinel tag is missing, duplicated, or misordered.
- [ ] Non-sentinel regions (Cover, System Overview, Research Labs, Learning Roadmap) are verified to be bit-identical before and after generation.
- [ ] If generated content matches existing file content, generator exits without writing.

---

### 2.9 Remediation D-09: Single Timestamp Source & Shared Formatting Contract

#### Defect Analysis:
Timestamp string formats could diverge between the web dossier and `README.md`.

#### Architectural Specification:
1. **Single Canonical Timestamp**:
   `data.provenance.collected_at_utc` in `docs/data/github-data.json` is the sole source of truth (ISO-8601 UTC: `YYYY-MM-DDTHH:mm:ss.sssZ`).
2. **Formatting Invariant**:
   - In `README.md` Section 05: `Snapshot Collection Timestamp: ${data.provenance.collected_at_utc}`.
   - In `README.md` Section 08: `[ REVISION ] // REV: 0.1.0 // ${data.provenance.collected_at_utc.split('T')[0]}`.
   - On Website Sheet 05: `SNAPSHOT: ${data.provenance.collected_at_utc}`.
   - On Website Sheet 12: `provenance-timestamp.textContent = data.provenance.collected_at_utc`.

#### Acceptance Criteria for D-09:
- [ ] Snapshot timestamp in `README.md` and `docs/index.html` match character-for-character.
- [ ] Revision date in `README.md` footer matches the snapshot UTC collection date.

---

## 3. UPDATED 15-TEST VERIFICATION MATRIX

| Test ID | Test Scenario | Input / Injection | Expected Outcome | Failure Condition |
| :-: | :--- | :--- | :--- | :--- |
| **TC-01** | Repeated Identical Sync | Identical remote data SHA-256 | Exit code 0; 0 file writes; dirty check `false` | Git dirty flag set or unneeded write |
| **TC-02** | New Repo Discovery | Mock API returns 10 repos | Table gains row; SVG updates to `10`; schema passes | Repo omitted or hardcoded test fail |
| **TC-03** | Archived Repo Handling | Mock API returns `is_archived: true` | Table marks repo `[ARCHIVED]`; count maintained | Unhandled crash or missing tag |
| **TC-04** | Language Byte Update | Mock API returns new language bytes | Sheet 06 and README percentages update cleanly | Stale percentages or NaN ratio |
| **TC-05** | Commit Deduplication | Mock API returns duplicate commit SHAs | Recent commits array deduplicated by SHA | Duplicate SHA in commits array |
| **TC-06** | Pre-Flight Quota Gate | Mock quota remaining = 24 ($< 56$) | Clean exit 0; logged `QUOTA_PRE_FLIGHT`; 0 writes | Request dispatched or crash |
| **TC-07** | In-Flight Quota Gate | Remaining drops to 34 after req #3 | `makeRequest` throws `QuotaExhaustionError`; 0 writes | Requests continue below 35 |
| **TC-08** | Partial HTTP 500 Failure | Endpoint `/languages` returns 500 × 3 | Max retries reached; aborts cleanly; snapshot intact | Partial file written or unhandled crash |
| **TC-09** | Schema Breach Abort | Mock payload missing required field `user.id` | `validateDraft07` rejects payload; exits 1 | Malformed snapshot written |
| **TC-10** | Atomic Rename Failure | Target file locked / permission denied | `catch` block catches error; `finally` cleans `.tmp` | Orphaned `.tmp` left on disk |
| **TC-11** | Missing README Sentinel | Delete closing registry sentinel tag | Generator throws `SENTINEL CARDINALITY ERROR`; exits 1 | README overwritten or truncated |
| **TC-12** | Duplicate README Sentinel| Insert duplicate opening metrics tag | Generator throws `SENTINEL CARDINALITY ERROR`; exits 1 | Ambiguous replacement executed |
| **TC-13** | Curated Text Invariance | Run generator on modified snapshot | Curated sections bit-identical; dynamic blocks updated | Any diff in Section 01, 04, 06, 07 |
| **TC-14** | SVG XML & ViewBox Invariance | Run SVG generator with new values | Valid XML tree; viewBox `0 0 960 140`; text formatted | XML parsing error or layout shift |
| **TC-15** | Two-Tier Client Fallback | Delete `github-data.json`; provide `.prev.json` | Data service recovers via `.prev.json`; 0 DOM errors | Crash or unhandled Promise rejection |

---

## 4. SEQUENTIAL IMPLEMENTATION DEPENDENCY GRAPH

```
[ Step 1: Schema v1.3.0 ]
  │
  ├─► [ Step 2: SVG XML IDs ]
  │     │
  │     └─► [ Step 3: README Sentinels ]
  │           │
  │           └─► [ Step 4: Client Resilience (.prev.json) ]
  │                 │
  │                 └─► [ Step 5: Sync Engine (scripts/sync-github-data.js) ]
  │                       │
  │                       └─► [ Step 6: Generators (README & SVG) ]
  │                             │
  │                             └─► [ Step 7: Dynamic Test Suite (phase-6-sync-audit.js) ]
  │                                   │
  │                                   └─► [ Step 8: Decoupled Actions Workflow ]
```

---

## 5. SECURITY & ROLLBACK CONSIDERATIONS

1. **Zero Elevated Token Exposure**: Job 1 runs with standard read-only permissions. Even in the event of an exploited dependency or compromised API response, no write permissions exist.
2. **Automated Rollback Guarantee**: If any validation step fails during generation, the script executes `git checkout -- docs/data/ assets/profile/ README.md` and deletes all `.tmp` artifacts.
3. **No Private Repository Leakage**: Ingestion filters strictly on `visibility === 'public'` and `fork === false` (or explicitly verified public forks). Internal projects (`LIFEOS`, `StorageGuardian`) are never queried or referenced.

---
*Blueprint Architecture Remediation Specification // SAHA-BP-2026-01-PHASE-6.0.2 // Planning Only*
