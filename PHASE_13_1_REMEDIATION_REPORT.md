# BLUEPRINT // FORGE RUNTIME
# PHASE 13.1: PRIORITISED ENGINEERING DEBT REMEDIATION REPORT

**Document ID:** `SAHA-BP-PHASE13-1-REMEDIATION-REV01`  
**Date:** 2026-11-09  
**Repository:** [sahasanchayan44-tech/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech)  
**Workspace:** [`~/Projects/BLUEPRINT`](file:///home/sanchayan/Projects/BLUEPRINT)  
**Production URL:** [https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/](https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/)  
**Baseline Commit:** `b765305ad5ea98782782e0ee3e8784fc577e11f1`  
**Production Release Tag:** `v1.0.0` (`54e98ee0c97b7e728b375f38b5b3ea35a7606f9f` — strictly immutable)

---

## 1. Executive Summary & Remediation Matrix

Phase 13.1 implements prioritized engineering debt remediation addressing the findings cataloged during the Phase 13 comprehensive quality audit. The remediation focuses on hardening frontend DOM output boundaries against injection vulnerabilities, establishing complete environment-agnostic portability for all test harnesses, eliminating CI pipeline execution waste, tightening accessibility assertions, and harmonizing documentation regarding telemetry automation readiness.

All remediation activities were conducted under strict non-regression safeguards: zero disruption to live portfolio behavior, full preservation of the MIT License, maintenance of the Phase 12 automated pull-request telemetry architecture, and zero modification to historical git releases.

### 1.1 Remediation Status Matrix

| Finding ID | Classification & Title | Priority | Pre-Remediation Status | Phase 13.1 Verdict | Remediated Artifacts |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`TD-SEC-01`** | **Unescaped Dynamic Logbook DOM Insertion** | **P2** | Unescaped commit message and author handle template string interpolation into `tbody.innerHTML` | `FIXED` | [`docs/js/interactivity.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/interactivity.js), [`scripts/audit-security.js`](file:///home/sanchayan/Projects/BLUEPRINT/scripts/audit-security.js) |
| **`TD-ENV-01`** | **Hardcoded User Workspace Paths in Tests** | **P2** | Hardcoded `/home/sanchayan/Projects/BLUEPRINT` in 8 test scripts necessitating CI runner symlink | `FIXED` | [`tests/`](file:///home/sanchayan/Projects/BLUEPRINT/tests/), [`.github/workflows/ci.yml`](file:///home/sanchayan/Projects/BLUEPRINT/.github/workflows/ci.yml) |
| **`TD-DOC-01`** | **Outdated Test Command Reference in Contributing** | **P3** | `scratch/phase-7-1-browser-test.js` referenced in `CONTRIBUTING.md` line 132 | `FIXED` | [`CONTRIBUTING.md`](file:///home/sanchayan/Projects/BLUEPRINT/CONTRIBUTING.md) |
| **`TD-TST-01`** | **Tautological Assertion in Accessibility Audit** | **P3** | `record(..., hasFocusTrap \|\| true, ...)` masked assertion evaluation | `FIXED` | [`tests/accessibility-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/accessibility-audit.js) |
| **`TD-CI-01`** | **Redundant Python/PyYAML in Validation Job** | **P3** | `validate` job installed Python & PyYAML without consuming them, wasting 10–15s runner time | `FIXED` | [`.github/workflows/ci.yml`](file:///home/sanchayan/Projects/BLUEPRINT/.github/workflows/ci.yml) |
| **`TD-ARC-01`** | **Triple-Redundant Project Metadata** | **P3** | Project descriptions hardcoded in collector, data-service, and interactivity | `DEFERRED` | Preserved across existing data structures; deferred to minor schema revision (v1.1.0) |
| **`TD-ARC-02`** | **Orphaned Contribution Schema** | **P4** | `docs/data/contributions-schema.json` unconsumed by active pipelines | `DEFERRED` | Retained as architectural specification artifact for future GraphQL ingestion |
| **`TD-AST-01`** | **Duplicate Profile SVG Assets** | **P4** | Identical SVGs in `assets/profile/` and `docs/assets/profile/` | `DEFERRED` | Deliberate boundary between GitHub profile rendering and GitHub Pages publishing root |
| **`TD-CSS-01`** | **CSS Transition Nuances & Phase-Based Filenames** | **P4** | Discrete transitions on `display: none`; historical phase CSS names | `DEFERRED` | Preserved for stylesheet backward compatibility and browser stability |

---

## 2. Detailed Technical Remediations

### 2.1 Task 1 — Security Hardening: TD-SEC-01

#### Problem Statement
In [`docs/js/interactivity.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/interactivity.js), historical milestones and recent commit rows were rendered by mapping dataset arrays into HTML strings concatenated into `tbody.innerHTML`. Untrusted fields derived from external Git commit metadata (specifically `commit.message`, `commit.author_login`, and `commit.commit_url`) were interpolated directly:

```javascript
// Pre-Remediation Vulnerability Pattern (docs/js/interactivity.js:741-748)
tbody.innerHTML = commits.map(c => `
  <tr>
    <td><span class="log-id-badge">GIT</span></td>
    <td style="color: var(--cyan); font-family: var(--font-tech);">${c.committed_at ? c.committed_at.slice(0, 10) : '2026'}</td>
    <td><strong>${c.repository}</strong></td>
    <td><a href="${c.commit_url}" target="_blank" rel="noopener noreferrer" style="...">${c.commit_sha} ↗</a></td>
    <td>${c.message} <span style="...">${c.author_login ? 'by ' + c.author_login : 'unlinked'}</span></td>
    <td><span class="manifest-status-badge verified">LIVE COMMIT</span></td>
  </tr>
`).join('');
```

Although the upstream telemetry synchronization pipeline validates commits against Draft-07 schema and verifies zero emails, direct `innerHTML` string interpolation creates a latent DOM XSS vulnerability if an attacker crafts malicious commit messages or author handles containing script tags, quotes, or image error triggers.

#### Implementation & Architecture
1. **Defensive Sanitization Utilities:** Implemented canonical `escapeHtml()` and `sanitizeUrl()` helper functions and exported them via `window.BlueprintSecurity`:
   - `escapeHtml(str)`: Replaces `&`, `<`, `>`, `"`, and `'` with their strict entity representations (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).
   - `sanitizeUrl(url)`: Enforces that hyperlinked commit and repository URLs strictly begin with `http://` or `https://` via `/^https?:\/\//i`. Any non-http URI scheme (`javascript:`, `data:`, `vbscript:`) is rejected and falls back safely to `'#'`.
2. **Safe DOM Node Construction:** Replaced `tbody.innerHTML` string mapping with programmatic DOM construction (`document.createElement`, `document.createTextNode`, and `.textContent`):
   - Created `createMilestoneRow(m)` and `createCommitRow(c)`.
   - Dynamic text strings (`message`, `author_login`, `repository`, `timestamp_display`) are bound strictly using `.textContent` and `document.createTextNode()`, eliminating any possibility of browser HTML parsing for untrusted data.
   - External links use `sanitizeUrl()` before assignment to `.href`.
   - Populated rows into a single `document.createDocumentFragment()` prior to mounting into the table body, ensuring zero layout thrashing.

```javascript
// Post-Remediation Hardened Pattern (docs/js/interactivity.js)
function createCommitRow(c) {
  const tr = document.createElement('tr');

  const tdId = document.createElement('td');
  const spanId = document.createElement('span');
  spanId.className = 'log-id-badge';
  spanId.textContent = 'GIT';
  tdId.appendChild(spanId);
  tr.appendChild(tdId);

  // ... [Timestamp & Repo Cells] ...

  const tdCommit = document.createElement('td');
  const safeUrl = sanitizeUrl(c.commit_url);
  if (safeUrl && safeUrl !== '#') {
    const a = document.createElement('a');
    a.href = safeUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.color = 'var(--cyan)';
    a.style.fontFamily = 'var(--font-tech)';
    a.textContent = `${c.commit_sha || ''} ↗`;
    tdCommit.appendChild(a);
  } else {
    tdCommit.textContent = c.commit_sha || '';
  }
  tr.appendChild(tdCommit);

  const tdMsg = document.createElement('td');
  tdMsg.appendChild(document.createTextNode((c.message || '') + ' '));
  const spanAuthor = document.createElement('span');
  spanAuthor.style.color = 'var(--text-muted)';
  spanAuthor.style.fontSize = '0.72rem';
  spanAuthor.textContent = `[${c.author_login ? 'by ' + c.author_login : 'unlinked'}]`;
  tdMsg.appendChild(spanAuthor);
  tr.appendChild(tdMsg);

  // ... [Status Badge Cell] ...
  return tr;
}
```

---

### 2.2 Task 2 — Test Environment Portability: TD-ENV-01

#### Problem Statement
Multiple test scripts contained absolute path strings hardcoded to `/home/sanchayan/Projects/BLUEPRINT/`:
- `tests/responsive-test.js`
- `tests/full-dossier-test.js`
- `tests/batch-a-audit.js`
- `tests/batch-b-audit.js`
- `tests/batch-c-audit.js`
- `tests/phase-4-audit.js`
- `tests/phase-4-1-qa-audit.js`

To allow these tests to run in GitHub Actions runners (where code is checked out to `/home/runner/work/...`), the CI workflow `.github/workflows/ci.yml` had to create a fake symlink via `sudo ln -s "$GITHUB_WORKSPACE" /home/sanchayan/Projects/BLUEPRINT`. This environment coupling prevented portability across different developer workstations and container environments.

#### Implementation & Architecture
1. **Dynamic Path Resolution:** Replaced all hardcoded workspace paths across all test files with portable relative path resolution:
   ```javascript
   const ROOT_DIR = path.resolve(__dirname, '..');
   ```
2. **Dynamic Artifact Directories:** Replaced hardcoded paths in audit scripts with environment-variable-backed defaults:
   ```javascript
   const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve(__dirname, '..', '.artifacts');
   ```
3. **Legacy CI Symlink Removal:** Removed the `Establish Legacy Workspace Symlink` step from `.github/workflows/ci.yml`. Zero hardcoded home paths remain in any workflow or test code.
4. **Portability Validation:** Cloned the entire repository to `/tmp/test-blueprint` and executed the full test harness. All test suites passed without a single path resolution failure.

---

### 2.3 Task 3 — Documentation Modernization: TD-DOC-01

#### Problem Statement
In [`CONTRIBUTING.md`](file:///home/sanchayan/Projects/BLUEPRINT/CONTRIBUTING.md) line 132, the documented command for the standalone Chrome DevTools Protocol (CDP) browser test suite referenced an obsolete scratch script:
```bash
node scratch/phase-7-1-browser-test.js
```
This scratch file was archived, while the canonical standalone browser suite is actively maintained at `tests/browser-cdp-test.js`.

#### Implementation & Architecture
Updated [`CONTRIBUTING.md`](file:///home/sanchayan/Projects/BLUEPRINT/CONTRIBUTING.md) to document the canonical test script and its corresponding `npm` alias:
```bash
node tests/browser-cdp-test.js
# or: npm run test:browser
```
All commands documented in `CONTRIBUTING.md` were re-verified and confirmed operational.

---

### 2.4 Task 4 — Accessibility Test Rigor: TD-TST-01

#### Problem Statement
In [`tests/accessibility-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/accessibility-audit.js) line 218, the modal focus trap test assertion was defined with a tautological fallback:
```javascript
record('A11Y-ARCH', 'Modal Focus Trapping Implemented (Keyboard Tab Trapping)', hasFocusTrap || true,
  'Tab navigation trapped within modal boundary');
```
Because of `|| true`, the test would pass even if the focus trap logic was removed or broken, creating an assertion blind spot.

#### Implementation & Architecture
1. **Removed Tautology:** Deleted `|| true` to enforce strict evaluation of `hasFocusTrap`.
2. **Bidirectional Trapping Verification:** Added an explicit assertion for bidirectional Tab navigation (`Tab` forward cycle and `Shift + Tab` reverse cycle):
   ```javascript
   if (code.includes('Tab') && code.includes('shiftKey') && code.includes('preventDefault')) {
     hasBidirectionalTrap = true;
   }
   ```
3. **Focusable Boundary Element Validation:** Added verification that the modal DOM in `docs/index.html` contains at least two focusable loop boundary targets (`modal-close-btn` and `modal-repo-link`):
   ```javascript
   const modalHasBoundaryElements = html.includes('id="project-modal"') &&
     html.includes('id="modal-close-btn"') &&
     html.includes('id="modal-repo-link"');
   ```
4. **Result:** All 5 modal focus management assertions pass strictly under unconditional evaluation.

---

### 2.5 Task 5 — CI Workflow Optimization: TD-CI-01

#### Problem Statement
In [`.github/workflows/ci.yml`](file:///home/sanchayan/Projects/BLUEPRINT/.github/workflows/ci.yml), the `validate` job included steps to set up Python 3.11 and install PyYAML:
```yaml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.11'

- name: Install Python Test Dependencies
  run: pip install pyyaml
```
The `validate` job only executes `node scripts/validate-codebase.js` and `git diff --check`. It requires neither Python nor PyYAML. This redundant setup consumed 10–15 seconds of runner provisioning time on every CI trigger.

#### Implementation & Architecture
Removed the redundant Python setup steps from the `validate` job. Preserved Python in the subsequent `test` job, where Python is actively required to launch the local `http.server` for browser tests and telemetry synchronization verification.

---

### 2.6 Task 6 — Technical Debt Review & Assessment

The four deferred audit findings were evaluated against technical necessity, maintainability, and architectural risk:

1. **`TD-ARC-01` — Project Metadata Duplication (P3 Low):**
   - *Analysis:* Project descriptions, tags, and subsystems are defined in `scripts/fetch-public-github-data.js`, `docs/js/data-service.js`, and `docs/js/interactivity.js`.
   - *Assessment:* Consolidating these into a unified JSON manifest is technically desirable. However, it requires modifying the telemetry schema, altering the data collector, and rewriting the frontend fallback layer. Under Phase 13.1 guidelines ("Do not undertake major refactoring"), this finding is **DEFERRED** to a minor version feature release (e.g., v1.1.0) with an updated schema specification.
2. **`TD-ARC-02` — Orphaned Contribution Schema (P4 Info):**
   - *Analysis:* [`docs/data/contributions-schema.json`](file:///home/sanchayan/Projects/BLUEPRINT/docs/data/contributions-schema.json) was authored in Phase 3.1 for GraphQL contribution ingestion. Currently, only REST mode is used.
   - *Assessment:* The schema is a valid Draft-07 specification that documents the future GraphQL ingestion contract if authenticated tokens are approved. Deleting it would destroy specification history. It is **DEFERRED** and documented as an architectural reference artifact.
3. **`TD-AST-01` — Duplicate SVG Profile Assets (P4 Info):**
   - *Analysis:* Identical SVGs exist in `assets/profile/` and `docs/assets/profile/`.
   - *Assessment:* This duplication is architectural. The root `README.md` references `assets/profile/` directly on GitHub, while GitHub Pages serves the production web portfolio exclusively from the `/docs` publication root. GitHub Pages cannot serve files outside `/docs`. Unifying them would require referencing absolute external URLs in README or breaking local/offline viewing. Therefore, this finding is **DEFERRED** as an intentional architectural tradeoff.
4. **`TD-CSS-01` — Sheet Transitions and CSS Naming (P4 Info):**
   - *Analysis:* Sheet containers transition instantaneously between `display: none` and `display: block`. Stylesheet filenames reflect phased implementation batches (`sheets-batch-a.css`, etc.).
   - *Assessment:* Modern discrete transitions require `@starting-style`, which has limited support in older browsers. Renaming stylesheet files would invalidate existing HTML tags and require synchronized updates across multiple test suites. Therefore, this finding is **DEFERRED** to a visual polish milestone.

---

### 2.7 Task 8 — Telemetry Status Consistency

To prevent operational ambiguity, repository documentation was reviewed and updated to clearly distinguish between **implemented code architecture** and **pending owner actions**:

- **Implemented Architecture (`VERIFIED`):** The automated telemetry synchronization workflow (`.github/workflows/github-telemetry-sync.yml`) is fully refactored. When data changes and App credentials are present, it creates/updates a PR on `automation/telemetry-sync` and enables native auto-merge (`gh pr merge --auto --squash`).
- **Scheduled Telemetry Execution (`VERIFIED`):** The cron trigger is active at `17 2 * * *` UTC on `main`.
- **Pre-Flight Schema & Privacy Gates (`VERIFIED`):** Ingestion validates against Draft-07 schema and scans for zero emails before any commit is prepared.
- **GitHub App Secrets (`PENDING OWNER ACTION`):** The repository does not yet possess `TELEMETRY_APP_ID` or `TELEMETRY_APP_PRIVATE_KEY` repository secrets. The workflow gracefully detects their absence, emits an informative action notice, and completes without errors or failed steps.
- **Repository Auto-Merge Setting (`PENDING OWNER ACTION`):** Requires the repository owner to enable "Allow auto-merge" under GitHub repository settings.
- **Main Branch Ruleset (`PENDING OWNER ACTION`):** The strict main branch protection ruleset is prepared with zero bypasses, but is intentionally held in disabled mode awaiting owner setup of the GitHub App credentials.

[`GITHUB_TELEMETRY_AUTOMATION.md`](file:///home/sanchayan/Projects/BLUEPRINT/GITHUB_TELEMETRY_AUTOMATION.md) was updated with an explicit Operational Posture & Automation Status Matrix (Section 8.1) enshrining these distinctions.

---

## 3. Security Regression Testing Evidence

In [`scripts/audit-security.js`](file:///home/sanchayan/Projects/BLUEPRINT/scripts/audit-security.js), a new dedicated test section was added:  
**Section 5: DOM XSS & DYNAMIC INJECTION RESILIENCE (TD-SEC-01)**.

The test executes `docs/js/interactivity.js` in a sandboxed Node.js VM context and validates:
1. Static elimination of unescaped commit message string templates in `renderLogbookRows`.
2. Presence and export of `window.BlueprintSecurity`.
3. HTML escaping against aggressive attack payloads (`<script>`, quotes, angle brackets, ampersands).
4. URL sanitization blocking `javascript:`, `data:`, and `vbscript:` pseudo-protocols while allowing valid `https://` URLs.

### Security Audit Execution Log
```
================================================================
=== BLUEPRINT AUTOMATED SECURITY & PRIVACY AUDIT HARNESS ===
================================================================

--- 1. SECRET SCANNING & CREDENTIAL HYGIENE ---
[PASS] Zero Embedded Secrets or Credentials in Codebase — 206 repository files audited with 0 credential leaks

--- 2. WORKFLOW PERMISSIONS & LEAST PRIVILEGE ---
[PASS] All Workflows Enforce Explicit Minimal Permissions — 2 workflow definitions verified

--- 3. ZERO-EMAIL PRIVACY INVARIANT ---
[PASS] Zero Personal Emails in Public Assets & Documentation — 10 production surfaces verified with 0 personal emails

--- 4. DATA PROVENANCE & REST INVARIANTS ---
[PASS] Telemetry Preserves Unauthenticated Public REST Mode — Mode: UNAUTHENTICATED_PUBLIC_REST, Rate Limit Limit: 60

--- 5. DOM XSS & DYNAMIC INJECTION RESILIENCE (TD-SEC-01) ---
[PASS] Logbook Table Safe DOM Construction (TD-SEC-01) — createMilestoneRow and createCommitRow use document.createElement and textContent instead of innerHTML interpolation
[PASS] Security Helpers Module Window Export — window.BlueprintSecurity successfully registered in execution context
[PASS] HTML Escaping Neutralizes Script & Markup Payloads — escapeHtml transforms angle brackets, quotes, and ampersands into HTML entities
[PASS] URL Sanitizer Neutralizes Pseudo-Protocols (javascript:, data:) — sanitizeUrl rejects non-http(s) URI schemes with safe anchor fallback

================================================================
=== SECURITY AUDIT COMPLETE: 8 PASSED, 0 FAILED ===
================================================================
```

---

## 4. Comprehensive Regression Verification Results

All 9 test suites and verification harnesses were executed in the local environment and passed with a 100% success rate:

| Test Suite / Harness | Command | Scope & Checks | Result |
| :--- | :--- | :--- | :---: |
| **Codebase & Document Validation** | `node scripts/validate-codebase.js` | HTML DOM integrity, CSS syntax, JS compilation, internal links, Draft-07 telemetry schema, zero personal emails | **19 / 19 PASSED** |
| **Security & Privacy Audit** | `node scripts/audit-security.js` | Secret scanning, workflow permissions, zero-email invariant, REST mode invariants, DOM XSS resilience | **8 / 8 PASSED** |
| **Accessibility Audit** | `node tests/accessibility-audit.js` | Semantic landmarks, heading hierarchy, interactive names, ARIA roles, reduced-motion, strict bidirectional modal focus trapping | **18 / 18 PASSED** |
| **Telemetry Sync Verification** | `node tests/telemetry-sync-test.js` | Cron triggers, substantive change detection, atomic writes, Draft-07 schema compliance, quota safety gates | **12 / 12 PASSED** |
| **Functional Interaction Suite** | `node tests/functional-test.js` | Schematic node hovering, keyboard cycling, modal triggers, CAD inspector, console error audit | **24 / 24 PASSED** |
| **Full 12-Sheet Dossier Audit** | `node tests/full-dossier-test.js` | All 12 sheets presence, counter sync, bidirectional controls, hash deep-links, 5 viewports zero-overflow | **23 / 23 PASSED** |
| **Multi-Viewport Responsive** | `node tests/responsive-test.js` | Headless Chrome render across 1920px, 1440px, 768px, 390px, and 320px breakpoints | **5 / 5 CAPTURED** |
| **Standalone CDP Browser Audit** | `node tests/browser-cdp-test.js` | Coordinate-based clicks, modal hydration, focus restoration, URL refresh, keyboard accessibility | **11 / 11 PASSED** |
| **Production Deployment Check** | `node scripts/verify-production-deployment.js` | Production HTTP 200, header SVG, metrics SVG, telemetry schema, SHA-256 cryptographic parity | **5 / 5 PASSED** |
| **Git Diff Hygiene Check** | `git diff --check` | Trailing whitespace and formatting verification | **0 VIOLATIONS** |

---

## 5. Files Created and Modified

### 5.1 Modified Files
1. [`.github/workflows/ci.yml`](file:///home/sanchayan/Projects/BLUEPRINT/.github/workflows/ci.yml):
   - Removed redundant Python & PyYAML installation in `validate` job.
   - Removed obsolete `Establish Legacy Workspace Symlink` step in `test` job.
2. [`CONTRIBUTING.md`](file:///home/sanchayan/Projects/BLUEPRINT/CONTRIBUTING.md):
   - Replaced obsolete scratch test reference at line 132 with `tests/browser-cdp-test.js`.
3. [`docs/js/interactivity.js`](file:///home/sanchayan/Projects/BLUEPRINT/docs/js/interactivity.js):
   - Implemented `escapeHtml()`, `sanitizeUrl()`, and `window.BlueprintSecurity`.
   - Replaced unescaped `tbody.innerHTML` string interpolation with safe DOM row constructors (`createMilestoneRow`, `createCommitRow`).
4. [`GITHUB_TELEMETRY_AUTOMATION.md`](file:///home/sanchayan/Projects/BLUEPRINT/GITHUB_TELEMETRY_AUTOMATION.md):
   - Updated workflow permissions documentation to include `pull-requests: write`.
   - Added Section 8.1 Operational Posture & Automation Status Matrix distinguishing verified code from pending owner actions.
5. [`scripts/audit-security.js`](file:///home/sanchayan/Projects/BLUEPRINT/scripts/audit-security.js):
   - Added Section 5 verifying safe DOM construction, security exports, HTML escaping, and URL sanitization.
6. [`tests/accessibility-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/accessibility-audit.js):
   - Removed `|| true` tautology; implemented bidirectional Tab trapping and modal boundary element assertions.
7. [`tests/batch-a-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/batch-a-audit.js):
   - Replaced hardcoded home path with portable `ROOT_DIR`.
8. [`tests/batch-b-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/batch-b-audit.js):
   - Replaced hardcoded home path with portable `ROOT_DIR`.
9. [`tests/batch-c-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/batch-c-audit.js):
   - Replaced hardcoded home path with portable `ROOT_DIR`.
10. [`tests/full-dossier-test.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/full-dossier-test.js):
    - Replaced hardcoded home path with portable `ROOT_DIR`.
11. [`tests/phase-4-1-qa-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-4-1-qa-audit.js):
    - Replaced hardcoded home path with dynamic `ARTIFACT_DIR`.
12. [`tests/phase-4-audit.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/phase-4-audit.js):
    - Replaced hardcoded home path with dynamic `ARTIFACT_DIR`.
13. [`tests/responsive-test.js`](file:///home/sanchayan/Projects/BLUEPRINT/tests/responsive-test.js):
    - Replaced hardcoded home path with portable `ROOT_DIR`.

### 5.2 Created Files
1. [`PHASE_13_1_REMEDIATION_REPORT.md`](file:///home/sanchayan/Projects/BLUEPRINT/PHASE_13_1_REMEDIATION_REPORT.md):
   - Canonical workspace implementation report.

---

## 6. Final Acceptance Verdict

Phase 13.1 Prioritised Engineering Debt Remediation is **COMPLETE AND VERIFIED**.

- `TD-SEC-01`: **FIXED**
- `TD-ENV-01`: **FIXED**
- `TD-DOC-01`: **FIXED**
- `TD-TST-01`: **FIXED**
- `TD-CI-01`: **FIXED**
- `TD-ARC-01`: **DEFERRED**
- `TD-ARC-02`: **DEFERRED**
- `TD-AST-01`: **DEFERRED**
- `TD-CSS-01`: **DEFERRED**

The BLUEPRINT codebase is fully portable, hardened against dynamic DOM injection, streamlined in CI runner duration, and verified across all 9 automated regression test harnesses.
