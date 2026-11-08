# BLUEPRINT CI/CD Architecture & Release Automation Specification

**Document Classification:** Engineering Infrastructure Specification
**Document ID:** SAHA-BP-2026-CICD
**Maintained by:** Sanchayan Saha ([sahasanchayan44-tech](https://github.com/sahasanchayan44-tech))
**Target Environments:** GitHub Actions (`ubuntu-latest`) & GitHub Pages
**Target Release:** Production Quality Assurance & Automated Delivery

---

## 1. CI/CD Architecture Overview

The BLUEPRINT Continuous Integration and Continuous Delivery (CI/CD) system provides automated quality enforcement, regression prevention, accessibility auditing, credential security monitoring, and live deployment verification.

The pipeline is engineered around a **zero-dependency vanilla web architecture**: the production client requires no compilation, minification, or asset transpilation steps. CI workflows leverage native Node.js runtime capabilities and headless Chrome DevTools Protocol (CDP) execution to achieve deterministic, fast verification runs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      BLUEPRINT CI/CD PIPELINE TOPOLOGY                 │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ 01 · VALIDATE       │ 02 · TEST & AUDIT         │ 03 · DEPLOY & VERIFY │
│ HTML / CSS / JS     │ Telemetry sync tests      │ GitHub Pages deploy  │
│ Draft-07 JSON Schema│ 12-sheet dossier suite    │ Live HTTP 200 checks │
│ Markdown link audit │ Multi-viewport responsive │ Telemetry SHA parity │
│ Zero-email privacy  │ Automated accessibility   │ Vector asset health  │
│ Git diff hygiene    │ Credential & token scan   │ Post-deploy health   │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

---

## 2. Workflow Triggers & Execution Policy

The primary CI/CD pipeline is implemented in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

### Configured Triggers
1. **Pull Requests (`pull_request`)**:
   - Triggers on any pull request targeting `main`.
   - Runs full validation, test regression, accessibility audit, and security checks.
   - **Does NOT** deploy or run post-deployment verification against production.
2. **Production Pushes (`push`)**:
   - Triggers on any commit pushed directly to `main`.
   - Runs all validation and test suites.
   - Upon successful completion, executes the `verify-deployment` job to validate live production endpoints.
3. **Manual Dispatch (`workflow_dispatch`)**:
   - Enables maintainers to trigger on-demand pipeline execution directly from the GitHub Actions web interface or GitHub CLI (`gh workflow run ci.yml`).

### Concurrency Policy
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```
- **Pull Requests**: Obsolete in-flight runs are automatically cancelled when new commits are pushed, conserving CI minutes.
- **Main Branch Pushes**: Runs are serialized without cancelling active jobs, ensuring deployment verifications complete reliably.

---

## 3. Validation Jobs (`validate`)

The `validate` job runs first on every trigger to enforce fundamental code health before heavy browser harnesses spin up:

- **HTML DOM Integrity**: Inspects `docs/index.html` for valid markup structure, ensures zero duplicate element IDs (117 unique IDs audited), verifies that all internal fragment anchors (`#id`) resolve to existing elements, and ensures all `<script>` and `<link>` tags point to authentic files.
- **CSS Syntax & Rule Consistency**: Audits all 9 modular stylesheets in `docs/css/` to guarantee balanced rule blocks, valid selector syntax, and property declarations.
- **JavaScript Syntax Compilation**: Performs syntax validation on all JavaScript files in `docs/js/`, `scripts/`, and `tests/` using Node.js `vm.Script` compilation.
- **Markdown Integrity & Link Resolution**: Validates all relative links across canonical project documentation (`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ACCESSIBILITY.md`, `CASE_STUDY.md`, `GITHUB_TELEMETRY_AUTOMATION.md`, `.github/PULL_REQUEST_TEMPLATE.md`).
- **Telemetry Schema Enforcement**: Validates `docs/data/github-data.json` against `docs/data/github-data-schema.json` using Draft-07 schema specifications.
- **Zero-Email Privacy Rule**: Enforces the project-wide privacy invariant that personal email addresses must never appear in production assets or public documentation.
- **Git Diff Hygiene**: Executes `git diff --check` to guarantee zero trailing whitespace or carriage-return irregularities.

---

## 4. Regression & Browser Testing (`test`)

The `test` job executes after `validate` has passed. It initializes a local HTTP server and executes the complete automated test suite:

1. **Workspace Symlink Pre-Conditioning**:
   Establishes `/home/sanchayan/Projects/BLUEPRINT -> $GITHUB_WORKSPACE` to guarantee 100% path compatibility with all existing test harnesses.
2. **Local Preview Server**:
   Spawns `python3 -m http.server 8088 --directory docs` and waits for port readiness.
3. **Telemetry Synchronization Suite** ([`tests/telemetry-sync-test.js`](./tests/telemetry-sync-test.js)):
   12 automated tests covering change detection, atomic writes, Draft-07 schema enforcement, and API quota thresholds.
4. **Functional Test Suite** ([`tests/functional-test.js`](./tests/functional-test.js)):
   24 automated tests covering Sheet 01 titles, document counters, schematic hover telemetry, keyboard navigation cycling, and console error cleanliness.
5. **Full Dossier Integration Suite** ([`tests/full-dossier-test.js`](./tests/full-dossier-test.js)):
   23 automated tests verifying all 12 sheet DOM containers, forward/backward navigation controls, keyboard navigation, and hash URL routing.
6. **Multi-Viewport Responsive Suite** ([`tests/responsive-test.js`](./tests/responsive-test.js)):
   5 viewport breakpoints (1920px, 1440px, 768px, 390px, 320px) enforcing zero horizontal document overflow.
7. **Standalone CDP Browser Suite** ([`scratch/phase-7-1-browser-test.js`](./scratch/phase-7-1-browser-test.js)):
   11 tests verifying modal URL hydration, focus trapping, focus restoration, and coordinate-based click navigation.

---

## 5. Automated Accessibility Auditing (`accessibility`)

The `accessibility` job runs in parallel with test suites to enforce usability standards:

- Evaluates `tests/accessibility-audit.js` (16 test assertions).
- **Landmarks & Metadata**: Declared language (`lang="en"`), descriptive title, viewport meta, core semantic landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`).
- **Heading Hierarchy**: Exactly one `<h1>`, no skipped heading levels.
- **Interactive Controls**: Non-empty accessible names (`aria-label`, text content) on all buttons and anchors.
- **ARIA Roles**: Verified `role="region"` with distinct `aria-label` across all 12 sheets, `role="tab"` and `role="tablist"` on navigation bars, and `role="dialog"` with `aria-modal="true"` on modals.
- **Reduced Motion**: Enforces presence of `@media (prefers-reduced-motion: reduce)` in stylesheets.
- **Modal Focus Management**: Asserts focus trapping within active dialogs, deterministic focus restoration to trigger buttons, and Escape key dismissal.

---

## 6. Security & Credential Hygiene (`security`)

The `security` job evaluates credential hygiene, permissions, and supply-chain dependencies:

- **Secret Scanning**: Scans repository text and code files against patterns for GitHub Personal Access Tokens, OAuth credentials, private SSH keys, and AWS credentials.
- **Workflow Permissions**: Audits `.github/workflows/` to ensure every workflow declares explicit, minimal permissions (`contents: read` for CI; `contents: write` strictly for telemetry sync).
- **Data Provenance**: Asserts unauthenticated public REST mode (`rate_limit.limit === 60`) in telemetry snapshots.
- **Dependabot Updates**: Automated weekly scanning configured via [`.github/dependabot.yml`](./.github/dependabot.yml) for `github-actions` and `npm` ecosystems.

---

## 7. Deployment Architecture & Live Verification (`verify-deployment`)

### GitHub Pages Publishing Mode
GitHub Pages is configured in **legacy branch mode**, publishing directly from branch `main`, directory `/docs`.

- **Safe Gating Mechanism**:
  1. Pull requests targeting `main` never trigger GitHub Pages builds, preventing unmerged or unreviewed code from reaching production.
  2. Commits merged to `main` trigger an automatic GitHub Pages deployment.
  3. When a push event occurs on `main`, the CI workflow's `verify-deployment` job executes after all quality, test, accessibility, and security jobs pass.
- **Production Verification Harness** ([`scripts/verify-production-deployment.js`](./scripts/verify-production-deployment.js)):
  Executes live HTTP requests against:
  - Homepage (`https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/`): Status 200, valid title, `text/html`.
  - Header SVG (`/assets/profile/blueprint-header.svg`): Status 200, valid SVG XML, `image/svg+xml`.
  - Metrics SVG (`/assets/profile/blueprint-metrics.svg`): Status 200, valid SVG XML, `image/svg+xml`.
  - Telemetry Endpoint (`/data/github-data.json`): Status 200, valid JSON, 100% cryptographic SHA-256 match with the repository snapshot.

---

## 8. Interaction with Daily Telemetry Automation

The daily telemetry synchronization workflow ([`.github/workflows/github-telemetry-sync.yml`](./.github/workflows/github-telemetry-sync.yml)) operates alongside the CI workflow:

- **Isolation of Triggers**:
  - `github-telemetry-sync.yml` runs on a scheduled cron (`17 2 * * *` UTC) and manual dispatch.
  - Commits created by the GitHub Actions bot (`chore(telemetry): ...`) use the default `GITHUB_TOKEN`.
  - Under GitHub Actions standard behavior, commits pushed by `GITHUB_TOKEN` do not trigger recursive workflow runs, preventing infinite CI loops.
- **Change Detection Guard**:
  - The telemetry collector uses `--only-if-changed` and ignores self-commits on the profile repository.
  - Telemetry snapshots are strictly validated against `docs/data/github-data-schema.json` before being committed.
  - If a telemetry commit is reviewed or pushed manually, the CI pipeline validates it against the Draft-07 schema and verifies 100% test compatibility.

---

## 9. Branch Protection Recommendations

To achieve full continuous delivery gating, the following GitHub branch protection rules are recommended for the `main` branch:

1. **Require a pull request before merging**:
   - Require at least 1 approval.
   - Dismiss stale pull request approvals when new commits are pushed.
2. **Require status checks to pass before merging**:
   - Require the following CI status checks:
     - `Codebase & Document Validation`
     - `Regression & Browser Test Suites`
     - `Accessibility & Usability Audit`
     - `Security & Credential Hygiene`
   - Require branches to be up to date before merging.
3. **Prevent force-pushes**: Ensure historical integrity is immutable.
4. **Prevent branch deletion**: Safeguard `main` from accidental deletion.

> **Note**: In accordance with project governance policies, branch protection rules require repository administrator action in GitHub repository settings and are not modified automatically.

---

## 10. How to Diagnose Failed Workflows

When a CI workflow fails, follow these steps to isolate and diagnose the issue:

1. **Locate Failed Job in GitHub Actions**:
   Navigate to the repository **Actions** tab and select the failing run.
2. **Inspect the Error Output**:
   - `validate`: Review output for broken Markdown links, unclosed CSS braces, duplicate IDs, or schema violations.
   - `test`: Review the specific test failure line. Check whether port 8088 preview server or Chrome CDP logged an uncaught exception.
   - `accessibility`: Review the failing accessibility rule (e.g., unlabelled button or skipped heading).
   - `security`: Review secret pattern matches or workflow permission warnings.
   - `verify-deployment`: Check live HTTP status codes and SHA-256 mismatch logs.
3. **Reproduce Locally**:
   Run the exact failing command locally from the workspace root:
   ```bash
   node scripts/validate-codebase.js
   node tests/accessibility-audit.js
   node scripts/audit-security.js
   node tests/full-dossier-test.js
   ```

---

## 11. Known Limitations

1. **Direct Pages Publishing on Main**: Because GitHub Pages is currently configured in legacy mode from `main:/docs`, commits pushed directly to `main` are deployed immediately by GitHub Pages before the post-deployment verification job runs. Enabling branch protection requiring PR reviews provides the necessary pre-merge gate.
2. **Automated Accessibility Scope**: Automated accessibility tests verify semantic structure, accessible names, keyboard architecture, and ARIA consistency, but do not replace comprehensive human manual testing with screen readers (NVDA, VoiceOver) or a formal WCAG 2.1 AAA audit.

---

## 12. Future Improvements

1. **GitHub Actions Pages Deployment**: Transition GitHub Pages from legacy branch source to `build_type: workflow` using `actions/deploy-pages@v4`, allowing the deployment step itself to be strictly conditioned on CI job success.
2. **Visual Regression Diffs**: Introduce automated pixel-by-pixel visual diffing (e.g., pixelmatch) comparing screenshot artifacts across pull requests to flag unintended layout shifts.
3. **Lighthouse Performance CI**: Incorporate automated Lighthouse CI performance budgets for Time to Interactive (TTI) and First Contentful Paint (FCP).
