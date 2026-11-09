# Changelog

All notable changes to the BLUEPRINT project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-11-10

### Added
- **Favicon Vector Asset Declaration (OBS-13-3-01):** Declared `<link rel="icon" type="image/svg+xml" href="assets/profile/blueprint-header.svg">` in `docs/index.html` head, eliminating automated browser root `/favicon.ico` 404 network requests.
- **Dual-Target SVG Asset Synchronization Gate (TD-AST-01):** Established automated bit-for-bit buffer comparison in `scripts/validate-codebase.js` verifying identical content between root `assets/profile/` and `docs/assets/profile/` vector assets.
- **Reserved Contributions Schema Integrity Gate (TD-ARC-02):** Added structural JSON Schema validation to `scripts/validate-codebase.js` to safeguard `docs/data/contributions-schema.json` as a formal architectural contract for future GraphQL ingestion.
- **Automated Accessibility Audit Suite:** Introduced `tests/accessibility-audit.js` covering semantic landmarks, single-H1 heading hierarchy, button/hyperlink accessible names, ARIA tablists, and bidirectional modal focus traps.
- **Standalone Browser CDP Test Harness:** Promoted `tests/browser-cdp-test.js` to tracked CI tests, exercising coordinate-based mouse input, modal link hydration, and hash navigation via native WebSocket Chrome DevTools Protocol.
- **Repository Community Standards:** Introduced `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1), `CONTRIBUTING.md`, `SECURITY.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and structured issue templates in `.github/ISSUE_TEMPLATE/`.
- **Open-Source MIT License:** Formally adopted the permissive MIT License in `LICENSE` and declared `MIT` SPDX license identifiers across project metadata.

### Changed
- **Automated Telemetry Pull Request Architecture:** Refactored GitHub telemetry synchronization from direct branch pushes to an automated Pull Request model (`automation/telemetry-sync` -> `main`) with GitHub App authentication and branch protection compliance.
- **Scheduled Telemetry Execution Jitter:** Re-scheduled daily telemetry workflow from top-of-hour (`0 0 * * *`) to jittered cron `17 2 * * *` UTC (07:47 IST) to prevent runner queue contention.
- **Test Portability (TD-ENV-01):** Replaced hardcoded absolute workspace paths with dynamic `__dirname` resolution across all test scripts, enabling deterministic execution in any environment.

### Fixed
- **Sheet Transition Animation (TD-CSS-01):** Replaced ineffective CSS transition on `display: none !important` containers in `docs/css/navigation.css` with a dedicated `@keyframes sheetFadeIn` (`0.15s ease-out`) applied to `.sheet-container.active-sheet`, with `prefers-reduced-motion` safety overrides (`0.01ms !important`).
- **Telemetry Self-Commit Filtering:** Enhanced substantive change detector in `scripts/fetch-public-github-data.js` to ignore automated telemetry synchronization commits when evaluating repository velocity.
- **Deterministic Test Polling:** Replaced arbitrary sleep timeouts with active DOM readiness and layout stabilization polling across browser test suites.

### Security
- **DOM XSS Remediation in Logbook Tables (TD-SEC-01):** Eliminated dynamic HTML interpolation in `docs/js/interactivity.js` (`createMilestoneRow`, `createCommitRow`), replacing `innerHTML` with safe DOM construction APIs (`document.createElement`, `textContent`) for untrusted commit messages and milestone strings.
- **Security & Privacy Audit Harness:** Introduced `scripts/audit-security.js` enforcing zero credential leaks across repository files, least-privilege workflow permissions, and zero personal email exposure.
- **Zero-Email Privacy Invariant:** Automated regular expression scanning across all production surfaces, telemetry snapshots, and documentation to guarantee zero personal email publication.

### Infrastructure
- **Comprehensive Continuous Integration (CI/CD):** Introduced `.github/workflows/ci.yml` targeting Node.js 22 LTS with 4 parallel required status checks:
  1. *Codebase & Document Validation*
  2. *Security & Credential Hygiene*
  3. *Accessibility & Usability Audit*
  4. *Regression & Browser Test Suites*
- **Main Branch Operational Safeguards:** Configured GitHub repository Ruleset `26818261` enforcing pull requests, required status checks, and zero bypass actors for all changes merging into `main`.
- **GitHub App Telemetry Authentication:** Configured GitHub Actions integration via `actions/create-github-app-token@v1` using dedicated repository secrets `TELEMETRY_APP_ID` and `TELEMETRY_APP_PRIVATE_KEY` for scheduled telemetry PR generation.

### Documentation
- **Engineering Case Study:** Published comprehensive `CASE_STUDY.md` documenting the CAD visual architecture, data integrity audits, and production release verification.
- **Architecture & Operational Guides:** Authored `CI_CD_ARCHITECTURE.md`, `GITHUB_TELEMETRY_AUTOMATION.md`, and `GITHUB_APP_SETUP_GUIDE.md`.
- **Data Integrity Specifications:** Documented reserved GraphQL contributions schema in `DATA_INTEGRITY_AUDIT.md` (Section 10) and established architectural analysis for metadata consolidation deferral (`TD-ARC-01`).

---

## [1.0.0] - 2026-11-08

### Added
- **Initial BLUEPRINT Production Release:** 12-sheet engineering CAD portfolio and architectural dossier.
- **Vector CAD Visual System:** Dark blueprint grid aesthetics, registration marks, technical frames, and SVG component schematics.
- **Interactive Sheet Architecture:** Coordinate-based sheet tabs (Sheets 01–12), keyboard arrow navigation, and hash URL routing.
- **Static Telemetry Snapshot:** Offline-first architecture hydrating public repository metrics via local `docs/data/github-data.json`.
- **Responsive CAD Engine:** Multi-breakpoint responsive layouts for 1920, 1440, 768, 390, and 320 px viewports.
