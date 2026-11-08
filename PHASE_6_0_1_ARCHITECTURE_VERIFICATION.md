# BLUEPRINT — PHASE 6.0.1 ARCHITECTURE VERIFICATION REPORT
## Independent Architecture Verification & Discrepancy Resolution

**Document Reference**: `SAHA-BP-2026-01-PHASE-6.0.1`  
**Target Profile**: Sanchayan Saha (`sahasanchayan44-tech` // User ID: `268472249`)  
**Specification Reference**: `PHASE_6_0_TECHNICAL_DESIGN.md`  
**Mode**: STRICT READ-ONLY TECHNICAL AUDIT  
**Status**: COMPLETE // PASS WITH CONDITIONS  
**Timestamp**: 2026-11-08T10:45:00+05:30  

---

## 1. EXECUTIVE SUMMARY & VERIFICATION OVERVIEW

In accordance with the **Phase 6.0.1 Independent Architecture Verification** directive, a comprehensive technical audit of the Phase 6.0 synchronization specification ([`PHASE_6_0_TECHNICAL_DESIGN.md`](file:///home/sanchayan/Projects/BLUEPRINT/PHASE_6_0_TECHNICAL_DESIGN.md)) was executed against the existing codebase ([`docs/data/github-data.json`](file:///home/sanchayan/Projects/BLUEPRINT/docs/data/github-data.json), [`docs/data/github-data-schema.json`](file:///home/sanchayan/Projects/BLUEPRINT/docs/data/github-data-schema.json), [`scripts/fetch-public-github-data.js`](file:///home/sanchayan/Projects/BLUEPRINT/scripts/fetch-public-github-data.js), [`docs/js/data-service.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/data-service.js), [`docs/js/interactivity.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/interactivity.js), [`tests/phase-5-2-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-5-2-audit.js), and local repository trees).

The audit established that the core architectural direction—unifying both presentation surfaces through a single, Draft-07-validated canonical snapshot—is sound, viable, and well-aligned with project invariants. However, the audit identified **four high-severity discrepancies and technical oversights** that must be resolved prior to Phase 6.1 implementation.

### High-Level Verdict Summary
- **Overall Verdict**: **PASS WITH CONDITIONS**
- **Discrepancies Identified**: 4 High Severity, 3 Medium Severity, 2 Low Severity.
- **Remediation Status**: Exact corrective specifications are defined in Section 14 of this report.

---

## 2. DETAILED INVESTIGATION FINDINGS

### 2.1 Investigation 1: 21-Request Footprint, Retries, Pagination & Daily Reconciliation
- **Baseline Verification**: The calculation of 21 requests for routine synchronization was confirmed:
  - 1 request: `GET /users/sahasanchayan44-tech`
  - 1 request: `GET /users/sahasanchayan44-tech/repos?per_page=100`
  - 1 request: `GET /users/sahasanchayan44-tech/events/public?per_page=100`
  - 9 requests: `GET /repos/{owner}/{repo}/languages` (1 per repository)
  - 9 requests: `GET /repos/{owner}/{repo}/commits?per_page=5` (1 per repository)
  - **Total Baseline**: $1 + 1 + 1 + 9 + 9 = 21\text{ requests}$. This matches the `rate_limit_snapshot.used: 21` recorded in [`docs/data/github-data.json`](file:///home/sanchayan/Projects/BLUEPRINT/docs/data/github-data.json).
- **Pagination Boundary**: A single request per repository/events endpoint retrieves up to 100 items. Currently, the developer namespace has 9 repositories and $\le 100$ recent events. Pagination is not triggered under current volume, but must be capped to 1 page during routine sync to prevent unbounded API consumption.
- **Daily Reconciliation Finding**: The specification proposed a "full reconciliation" checking milestones and releases. If each of the 11 historical milestones is verified via individual commit queries (`GET /repos/{owner}/{repo}/commits/{sha}`), this would add 11 requests; releases would add 9 requests. Total would reach $21 + 11 + 9 = 41\text{ requests}$. Under unauthenticated limits (60/hr), 41 requests leaves only 19 units remaining, tripping the safety gate ($< 35$).
- **Required Resolution**: When running unauthenticated, full reconciliation must verify milestone SHAs against the returned 5-commit arrays rather than issuing separate per-commit API queries.

### 2.2 Investigation 2: Worst-Case API Consumption & Rate-Limit Budgets
- **Scenario A: Unauthenticated Environment (60 requests/hr)**:
  - Routine run: 21 requests.
  - Worst case with 3 transient 5xx retries: $21 + 3 = 24\text{ requests}$.
  - Worst case with 3 newly discovered repositories ($N = 12$): $3 + (2 \times 12) = 27\text{ requests}$.
  - Available quota remaining after run: $60 - 27 = 33\text{ units}$.
  - Notice: $33 < 35$! If the safety gate is set to 35, the *following* run will be blocked unless a full reset window (1 hour) elapses.
- **Scenario B: Authenticated Environment (`GITHUB_TOKEN` in GitHub Actions)**:
  - Rate limit: **1,000 requests/hour per repository** (or 5,000 with a user PAT).
  - Worst case: 27–45 requests consumes only **2.7% – 4.5%** of the hourly budget.
  - Authenticated mode is completely safe against quota exhaustion.

### 2.3 Investigation 3: Quota Safety Gate Logic & In-Flight Depletion
- **Existing Implementation Audit**: In [`scripts/fetch-public-github-data.js`](file:///home/sanchayan/Projects/BLUEPRINT/scripts/fetch-public-github-data.js) lines 442–446, `MIN_QUOTA_SAFETY_THRESHOLD = 35` is checked **only once** during `runPreFlightCheck()`.
- **Vulnerability Identified**:
  1. If `remaining` is initially 36, pre-flight passes ($36 \ge 35$).
  2. The script then executes 21 requests.
  3. Quota is depleted to $36 - 21 = 15$ units.
  4. The in-flight request method (`makeRequest`) reads `res.headers['x-ratelimit-remaining']` but **never checks whether it has breached the safety threshold**!
- **Severity**: **HIGH**. The current collector can legally breach its own safety gate during execution.
- **Required Resolution**:
  - Pre-flight check must enforce: $\text{remaining} \ge \text{MIN\_QUOTA\_SAFETY\_THRESHOLD} + \text{ESTIMATED\_RUN\_REQUESTS}$ (i.e. $\ge 35 + 21 = 56$ in unauthenticated mode).
  - `makeRequest()` must enforce an active in-flight check: if `lastRemaining < MIN_QUOTA_SAFETY_THRESHOLD`, abort immediately before dispatching subsequent requests.

### 2.4 Investigation 4: Website Sheet Mapping Reconciliation (Sheet 03 vs Sheet 06)
- **Existing Website Architecture**:
  - **Sheet 03** ([`docs/index.html`](file:///home/sanchayan/Projects/BLUEPRINT/docs/index.html) L638–890): Titled `DEVELOPMENT STACK & PARTS INVENTORY`. Contains 6 structured cards categorizing languages and frameworks by qualitative maturity ratings (`ACTIVE`, `WORKING KNOWLEDGE`, `LEARNING`, `EXPERIMENTAL`).
  - **Sheet 06** ([`docs/index.html`](file:///home/sanchayan/Projects/BLUEPRINT/docs/index.html) L1655–1872): Titled `CONTRIBUTION ANALYSIS & CODE CADENCE`. Contains the Commit Heatmap CAD Grid AND the `PRIMARY LANGUAGE DISTRIBUTION (BYTE-WEIGHT)` meter card (L1815–1841: TypeScript 48%, JavaScript 24%, Python 16%, Kotlin 8%, Shell 4%).
- **Reconciliation Finding**:
  - The Phase 6.0 technical design correctly mapped language byte ratios to Sheet 06.
  - Sheet 03 represents **qualitative stack classification**, which is a manually curated engineering inventory.
  - Sheet 06 represents **empirical byte weight telemetry**, which is dynamic data derived from repository language analysis.
  - Both sheet identities are preserved without conflict.

### 2.5 Investigation 5: Schema v1.3.0 Backward Compatibility & Migration
- **Existing Implementation Audit**:
  - [`docs/data/github-data-schema.json`](file:///home/sanchayan/Projects/BLUEPRINT/docs/data/github-data-schema.json) required array (L6–14):
    `["provenance", "user", "telemetry", "repositories", "historical_milestones", "recent_repository_commits", "limitations"]`.
  - In `docs/js/data-service.js` L14–190, `FALLBACK_BASELINE` defines these exact 7 properties. It does NOT contain `"schema_version"` or `"sync_metadata"`.
- **Breaking Change Identified**:
  - `PHASE_6_0_TECHNICAL_DESIGN.md` Section 5.1 added `"schema_version"` and `"sync_metadata"` as **required** properties in schema v1.3.0.
  - If schema v1.3.0 is deployed with these fields marked as `required`, `FALLBACK_BASELINE` in `docs/js/data-service.js` and all existing tests in `tests/hardening-failure-injection.js` will immediately FAIL schema validation.
- **Severity**: **HIGH**.
- **Required Resolution**:
  - In `schema v1.3.0`, `"schema_version"` and `"sync_metadata"` must be defined as **optional** top-level properties (or `schema_version` must have default `"1.3.0"`), and `FALLBACK_BASELINE` in `docs/js/data-service.js` must be updated in lockstep.

### 2.6 Investigation 6: Atomic Replacement, Rollback & Failure Recovery
- **Verification of Mechanism**:
  - `fs.writeFileSync(tempPath)` writes to `docs/data/github-data.json.tmp`.
  - `fs.renameSync(tempPath, targetPath)` performs an atomic filesystem inode swap (POSIX compliant).
  - `try...catch...finally` unlinks `tempPath` regardless of whether write or validation succeeded.
- **Rollback File Gap**:
  - The design proposed backing up to `docs/data/github-data.prev.json`.
  - However, `docs/js/data-service.js` currently attempts to load only `data/github-data.json`, falling back directly to `FALLBACK_BASELINE` on error.
- **Improvement**: `BlueprintDataService.loadData()` should implement secondary fallback: try `data/github-data.json`, if failed try `data/github-data.prev.json`, if failed load `FALLBACK_BASELINE`.

### 2.7 Investigation 7: README Generation Boundaries & Sentinel Handling
- **Verification of Delimiters**:
  - The four proposed sentinel pairs (`BLUEPRINT_METRICS_CARD`, `BLUEPRINT_PROJECT_REGISTRY`, `BLUEPRINT_TELEMETRY_TABLE`, `BLUEPRINT_METADATA_FOOTER`) isolate the dynamic content cleanly.
- **Edge-Case Vulnerabilities**:
  1. *Missing Sentinel*: If a sentinel is missing, regex match will fail. The generator MUST abort with an error rather than writing a truncated document.
  2. *Duplicate Sentinels*: If a sentinel pair appears more than once, replacement is ambiguous. The generator must assert `count === 1`.
  3. *Unchanged Content (Idempotency)*: The generator must compare the freshly generated string against the existing file content. If identical, it must exit without writing to preserve file modification timestamps.

### 2.8 Investigation 8: SVG Telemetry Dynamic Update Safety
- **Verification of SVG Structure**:
  - In [`assets/profile/blueprint-metrics.svg`](file:///home/sanchayan/Projects/BLUEPRINT/assets/profile/blueprint-metrics.svg), dynamic figures reside in isolated `<text>` elements.
- **Vulnerability Identified**:
  - Updating via naive string replacement (e.g. `replace("09", "10")`) is fragile because numeric strings can match coordinates, viewBox numbers, or CSS values.
- **Required Resolution**:
  - In `blueprint-metrics.svg`, assign explicit `id` attributes to dynamic text elements:
    `id="metric-val-repos"`, `id="metric-val-engagement"`, `id="metric-val-ecosystems"`, `id="metric-val-schema"`.
  - The generator parses the SVG XML tree, updates the text content of elements matching those IDs, and verifies XML validity via `xml.etree.ElementTree`.

### 2.9 Investigation 9: GitHub Actions Workflow Security & Permissions Syntax Error
- **Syntax Error Identified**:
  - In `PHASE_6_0_TECHNICAL_DESIGN.md` Section 8.1, the workflow YAML placed `permissions: contents: write` inside a **step definition**:
    ```yaml
    - name: "Commit & Push Updated Surfaces (Least Privilege)"
      permissions:
        contents: write
    ```
  - **GitHub Actions does not support `permissions` at the step level.** `permissions` is valid ONLY at the workflow level or job level. GitHub Actions runner will reject this YAML with: `Unexpected value 'permissions' in step definition`.
- **Severity**: **HIGH**.
- **Required Resolution**:
  - Elevate `permissions: contents: write` to the job level, or split into two discrete jobs:
    1. Job `ingest-and-validate`: `permissions: contents: read`
    2. Job `publish-surfaces`: `permissions: contents: write` (executes only when working-tree diff is detected).

### 2.10 Investigation 10: Meaningfulness of Existing 77-Assertion Test Suite
- **Hardcoded Parity Flaw Identified**:
  - In [`tests/phase-5-2-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-5-2-audit.js), assertions explicitly check for frozen snapshot integers:
    - Line 82: `assert(repos.length === 9, ...)`
    - Line 95: `assert(readmeContent.includes('09 Public Codebases') || ...)`
    - Line 96: `assert(readmeContent.includes('02 Stars'), ...)`
    - Line 97: `assert(readmeContent.includes('02 Forks'), ...)`
    - Line 98: `assert(readmeContent.includes('22 API Query Transactions'), ...)`
    - Line 99: `assert(readmeContent.includes('38 Commits'), ...)`
    - Line 100: `assert(readmeContent.includes('11 Architectural Milestones'), ...)`
- **Impact on Automated Synchronization**:
  - If the sync pipeline discovers a 10th repository, or stars increase to 3, or commits increase to 40, `tests/phase-5-2-audit.js` in its current form will **FAIL** and block the pipeline!
- **Severity**: **HIGH**.
- **Required Resolution**:
  - For automated CI/CD synchronization, test assertions must evaluate **dynamic parity between `github-data.json` and `README.md`**:
    `assert(readmeContent.includes(String(snapshot.repositories.length).padStart(2, '0')), ...)`
    `assert(readmeContent.includes(String(snapshot.telemetry.total_stars).padStart(2, '0') + ' Stars'), ...)`
  - Static snapshot checks remain in `phase-5-2-audit.js` for historical verification; a dedicated `tests/phase-6-sync-audit.js` must be introduced for dynamic sync validation.

---

## 3. REQUIRED TEST DESIGN (15 EXPLICIT TEST CASES)

The following 15 test cases must be codified in `tests/phase-6-sync-audit.js` and `tests/hardening-failure-injection.js`:

| # | Test Scenario | Injection / Precondition | Expected Behavior | Verification Assertion |
| :-: | :--- | :--- | :--- | :--- |
| **TC-01** | Repeated Identical Sync | Active snapshot and remote data have identical SHA-256. | Pipeline exits 0; 0 file writes; 0 git changes detected. | `steps.git_diff.outputs.changes_detected == 'false'` |
| **TC-02** | New Repository Discovery | Mock API returns 10 repositories (new repo: `distributed-db`). | Snapshot updated; new row added to README table; repo count in SVG becomes `10`. | `snapshot.repositories.length === 10` & `README.includes('distributed-db')` |
| **TC-03** | Deleted / Archived Repo | Mock API returns 8 repositories (1 deleted) or 1 archived. | Snapshot marks repo as deleted/archived; README table removes or marks archived. | `repo.is_archived === true` & table updated |
| **TC-04** | Description & Language Change | Mock API returns updated language bytes and edited description. | Language percentages recomputed; byte weights in Sheet 06 and README updated. | `languages['TypeScript'] === newBytes` & dirty check triggers write |
| **TC-05** | Duplicate Commit Detection | Mock API returns identical commit SHAs across multiple pages. | Commits array deduplicates by `commit_sha`. | `new Set(commits.map(c => c.commit_sha)).size === commits.length` |
| **TC-06** | API Quota Exhaustion | Mock pre-flight quota remaining = 24 ($< 35$). | Pipeline logs `QUOTA_EXHAUSTION_PREVENTED`; exits cleanly; snapshot untouched. | `targetSnapshotHashBefore === targetSnapshotHashAfter` |
| **TC-07** | In-Flight Quota Exhaustion | Pre-flight quota = 36; drops to 34 after request #3. | In-flight check halts subsequent requests; exits cleanly; snapshot untouched. | No partial snapshot write; error logged |
| **TC-08** | Partial API Failure | Endpoint `GET /languages` returns HTTP 500 on attempt 1–3. | Pipeline logs failure; aborts; active snapshot preserved; `.tmp` unlinked. | `fs.existsSync(tempPath) === false` & snapshot intact |
| **TC-09** | Invalid JSON / Schema Breach | Mock API returns null for required property `login`. | `validateDraft07` fails with violation; atomic write bypassed; exits 1. | `errors.length > 0` & snapshot intact |
| **TC-10** | Failed Atomic Rename | `targetPath` locked / permission denied during `fs.renameSync`. | `catch` block preserves existing file; `finally` cleans up `.tmp`. | Existing snapshot hash identical; `.tmp` unlinked |
| **TC-11** | Missing README Sentinel | Remove `<!-- BLUEPRINT_PROJECT_REGISTRY:END -->` from test file. | Generator detects missing sentinel; aborts with error; README untouched. | Generator throws error; file content unchanged |
| **TC-12** | Duplicate README Sentinel | Duplicate `<!-- BLUEPRINT_METRICS_CARD:START -->` tag. | Generator detects sentinel count $> 1$; aborts with error; README untouched. | Generator throws error; file content unchanged |
| **TC-13** | Preservation of Curated Text | Run generator with modified snapshot. | Sentinels updated; Section 01, 04, 06, 07 and Cover text remain bit-identical. | String equality check on text outside sentinels |
| **TC-14** | SVG Integrity & Dimensions | Run SVG generator with new metric values. | XML DOM parsed cleanly; viewBox remains `0 0 960 140`; text within bounds. | `ElementTree.parse()` passes; viewBox identical |
| **TC-15** | Offline Fallback & All 12 Sheets | Block HTTP requests in browser test harness. | `BlueprintDataService` loads `FALLBACK_BASELINE`; all 12 sheets render without error. | Zero console errors; status `OFFLINE_FALLBACK` |

---

## 4. DISCREPANCY SUMMARY & SEVERITY CLASSIFICATION

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURAL DISCREPANCY AUDIT MATRIX                          │
├─────┬────────────────────────────────────────────────┬──────────┬──────────────────────┤
│ ID  │ DISCREPANCY TITLE                              │ SEVERITY │ IMPACTED COMPONENT   │
├─────┼────────────────────────────────────────────────┼──────────┼──────────────────────┤
│ D-01│ GitHub Actions Step-Level Permissions Syntax   │ HIGH     │ sync-blueprint.yml   │
│ D-02│ Hardcoded Static Assertions in Regression Test │ HIGH     │ phase-5-2-audit.js   │
│ D-03│ Schema v1.3.0 Required Field Backward Breakage │ HIGH     │ github-data-schema   │
│ D-04│ In-Flight Quota Safety Gate Gap                │ HIGH     │ sync-github-data.js  │
│ D-05│ Unauthenticated Full Reconciliation Over-Quota │ MEDIUM   │ Ingestion Schedule   │
│ D-06│ Naive SVG Text-Node Replacement Fragility      │ MEDIUM   │ generate-profile-svg │
│ D-07│ Missing Secondary Rollback in Data Service     │ MEDIUM   │ data-service.js      │
│ D-08│ Sentinel Missing/Duplicate Guard Incompleteness│ LOW      │ generate-readme.js   │
│ D-09│ Collection Timestamp Format Consistency        │ LOW      │ README vs Snapshot   │
└─────┴────────────────────────────────────────────────┴──────────┴──────────────────────┘
```

---

## 5. REQUIRED CORRECTIONS & ACCEPTANCE CRITERIA

### Mandatory Corrections for Phase 6.1:

1. **Workflow Syntax Correction (D-01)**:
   - Restructure `.github/workflows/sync-blueprint.yml` into two jobs or set `permissions: contents: write` at the job level. Never place `permissions` inside a step block.
2. **Dynamic Parity Test Harness (D-02)**:
   - Create `tests/phase-6-sync-audit.js` that compares `README.md` and SVG values dynamically against the active `docs/data/github-data.json` instead of testing hardcoded integers.
3. **Backwards-Compatible Schema v1.3.0 (D-03)**:
   - Ensure `"schema_version"` and `"sync_metadata"` are optional properties in `docs/data/github-data-schema.json`, and update `FALLBACK_BASELINE` in `docs/js/data-service.js` to match.
4. **In-Flight Quota Gate (D-04)**:
   - Implement `checkQuotaGate()` inside `makeRequest()` to abort immediately if `lastRemaining < MIN_QUOTA_SAFETY_THRESHOLD` at any point during execution.
5. **Budget-Aware Reconciliation (D-05)**:
   - Bound unauthenticated runs to $\le 21$ requests; reserve full multi-endpoint reconciliation for authenticated runs.
6. **SVG Explicit IDs (D-06)**:
   - Add explicit XML `id` attributes to metric text nodes in `assets/profile/blueprint-metrics.svg`.

---

## 6. FINAL VERDICT

### Overall Verdict: **PASS WITH CONDITIONS**

### Justification:
The foundational architecture specified in `PHASE_6_0_TECHNICAL_DESIGN.md` is approved. The core design principles (single Draft-07 source of truth, atomic replacement, bounded README generation, CAD asset preservation, and offline website fallback) are validated. Implementation in Phase 6.1 may proceed **only after incorporating the mandatory corrections (D-01 through D-06) specified above**.

---
*Blueprint Architecture Verification // SAHA-BP-2026-01-PHASE-6.0.1 // Strict Read-Only Audit*
