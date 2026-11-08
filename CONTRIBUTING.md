# Contributing to BLUEPRINT

Thank you for your interest in contributing to **BLUEPRINT**. This document outlines the technical standards, repository structure, development workflow, and contribution guidelines for the project.

---

## 1. Project Overview

BLUEPRINT is an interactive technical CAD portfolio and architectural engineering dossier. The project presents 12 comprehensive engineering sheets featuring interactive SVG schematics, responsive technical layouts, audited telemetry snapshots, and automated daily GitHub data synchronization.

The project is built on a **zero-build vanilla web architecture**: semantic HTML5, modular CSS3, and modern ESNext JavaScript deployed statically via GitHub Pages.

---

## 2. Repository Structure

```
BLUEPRINT/
├── .github/
│   ├── ISSUE_TEMPLATE/              # Structured GitHub issue forms
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── workflows/                   # GitHub Actions workflows
│   │   └── github-telemetry-sync.yml
│   └── PULL_REQUEST_TEMPLATE.md     # Standard PR template
├── assets/
│   └── profile/                     # Profile header and metrics vector SVGs
├── docs/                            # Production deployment root (GitHub Pages)
│   ├── assets/                      # Application vector assets and schematics
│   ├── css/                         # Modular stylesheets
│   │   ├── main.css
│   │   ├── sheets.css
│   │   ├── components.css
│   │   └── responsive.css
│   ├── data/                        # Audited telemetry JSON and Draft-07 schema
│   │   ├── github-data.json
│   │   └── github-data-schema.json
│   ├── js/                          # Application modules (vanilla ESNext)
│   │   ├── app.js
│   │   ├── data-service.js
│   │   ├── schematic.js
│   │   ├── modals.js
│   │   └── telemetry.js
│   └── index.html                   # 12-sheet unified DOM CAD application
├── scripts/                         # Automation & data ingestion utilities
│   └── fetch-public-github-data.js  # Telemetry collector with backoff & diff detection
├── tests/                           # Verification suites and audit harnesses
│   ├── functional-test.js           # Sheet 01 telemetry and keyboard navigation tests
│   ├── responsive-test.js           # Multi-viewport zero-overflow audit
│   ├── full-dossier-test.js         # Complete 12-sheet DOM & hash navigation suite
│   ├── telemetry-sync-test.js       # Telemetry collector, schema & privacy test suite
│   ├── phase-4-audit.js             # Data provenance & schema audit harness
│   └── phase-5-2-audit.js           # Claim calibration and README fidelity audit
├── ACCESSIBILITY.md                 # Accessibility statement & navigation guidelines
├── CASE_STUDY.md                    # In-depth architectural case study
├── CODE_OF_CONDUCT.md               # Contributor Covenant v2.1 code of conduct
├── CONTRIBUTING.md                  # This contribution guide
├── GITHUB_TELEMETRY_AUTOMATION.md   # Daily automation engineering specification
├── README.md                        # Master architectural dossier summary
└── SECURITY.md                      # Vulnerability reporting and security policy
```

---

## 3. Development Environment

BLUEPRINT requires no complex build tooling, transpilers, or bundlers. To work on the project locally:

- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **Python 3**: For serving the local HTTP development preview.
- **Google Chrome / Chromium**: For running automated browser tests using the Chrome DevTools Protocol (CDP).
- **Git**: For version control.

### Installation
Clone the repository and install test dependencies:

```bash
git clone https://github.com/sahasanchayan44-tech/sahasanchayan44-tech.git
cd sahasanchayan44-tech
npm install
```

---

## 4. Local Preview Instructions

Because BLUEPRINT loads telemetry data asynchronously via `fetch()`, open the application through a local web server rather than directly via `file://`:

```bash
python3 -m http.server 8088 --directory docs
```

Navigate to:

```
http://localhost:8088/index.html
```

---

## 5. Testing and Validation Procedures

Before submitting any changes, all relevant automated test suites must pass. Run the test harnesses locally:

### 1. Functional Test Suite
Verifies Sheet 01 title checks, document ID synchronization, interactive node hover states, keyboard cycling, modal triggers, and browser console error hygiene:
```bash
node tests/functional-test.js
```

### 2. Multi-Viewport Responsive Suite
Audits document layout and captures verification screenshots across 5 standard breakpoints (1920px, 1440px, 768px, 390px, 320px) to guarantee zero horizontal overflow:
```bash
node tests/responsive-test.js
```

### 3. Full 12-Sheet Dossier Integration Suite
Verifies DOM container presence, header/footer document counter synchronization, bidirectional navigation controls, keyboard arrow navigation, and hash URL routing (`#sheet-07`):
```bash
node tests/full-dossier-test.js
```

### 4. Telemetry Synchronization Suite
Verifies workflow configuration, change detection idempotency, Draft-07 schema compliance, zero-email privacy assertions, and API quota safety gates:
```bash
node tests/telemetry-sync-test.js
```

### 5. Standalone CDP Browser Suite
Performs coordinate-based mouse interaction audits, focus trap verification, and modal URL hydration:
```bash
node tests/browser-cdp-test.js
# or: npm run test:browser
```

### 6. Git Diff Hygiene Check
Ensure no unintended whitespace or formatting issues exist:
```bash
git diff --check
```

---

## 6. Branch and Commit Conventions

### Branch Naming
- Features: `feat/short-description`
- Bug fixes: `fix/short-description`
- Documentation: `docs/short-description`
- Refactoring / Maintenance: `chore/short-description`

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or capability.
- `fix:` A bug fix.
- `docs:` Documentation-only changes.
- `test:` Adding or updating test suites.
- `chore:` Maintenance tasks, dependency updates, or pipeline adjustments.
- `refactor:` Code refactoring that neither fixes a bug nor adds a feature.

Example:
```
docs: add GitHub community standards documentation
fix(modals): restore focus to originating project card on modal dismissal
```

---

## 7. Pull Request Expectations

1. **Target Branch**: Open all pull requests against the `main` branch.
2. **Pull Request Template**: Fill out all sections of `.github/PULL_REQUEST_TEMPLATE.md`.
3. **Scope and Modularity**: Keep PRs focused on a single change or cohesive set of changes. Avoid bundling unrelated fixes.
4. **Architectural Preservation**: Do not introduce heavy frontend frameworks, bundlers, or CSS preprocessors without prior maintainer consensus.
5. **Passing Tests**: All automated test suites must pass without regression.

---

## 8. Privacy and Security Requirements

Contributors must adhere to the project's strict privacy and security invariants:

- **Zero-Email Exposure**: Never commit personal email addresses in code, documentation, schema files, or commit messages. The repository maintains an automated assertion that flags any raw email patterns.
- **Unauthenticated Public APIs**: Telemetry ingestion uses GitHub's unauthenticated public REST API. Do not commit personal access tokens, OAuth credentials, or private API keys.
- **Data Integrity**: Never manually edit `docs/data/github-data.json` without ensuring strict compliance with `docs/data/github-data-schema.json`.
- **Private Information**: Do not expose private repository information, internal infrastructure details, or unverified claims.
