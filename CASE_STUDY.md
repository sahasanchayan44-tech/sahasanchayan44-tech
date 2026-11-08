# BLUEPRINT

## Engineering a Personal Technical Portfolio as a Structured Information System

**Version:** 1.0.0<br>
**Status:** Released and production verified<br>
**Category:** Frontend Engineering · Interface Architecture · Data Integrity · Quality Assurance<br>
**Repository:** [sahasanchayan44-tech/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech)<br>
**Release Commit:** [`54e98ee0c97b7e728b375f38b5b3ea35a7606f9f`](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/commit/54e98ee0c97b7e728b375f38b5b3ea35a7606f9f)<br>
**Production URL:** [https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/](https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/)

---

### 1. Project Overview

BLUEPRINT is a personal technical portfolio designed as an interactive 12-sheet engineering dossier.

The project organizes technical identity, audited skills, repository projects, research laboratory initiatives, GitHub snapshot activity, learning objectives, and communication channels into a structured, navigable interface.

Its visual language draws inspiration from technical documentation, Computer-Aided Design (CAD) systems, and engineering schematics, utilizing coordinate grids, title blocks, registration markers, and telemetry indicators to present technical capabilities with structural clarity.

---

### 2. Engineering Objectives

The system was engineered around five core technical objectives:

- **Structured Portfolio Interface:** Build an interactive and structured technical portfolio presenting engineering work through a standardized dossier format.
- **Coherent Information Architecture:** Establish a unified 12-sheet layout with consistent navigation, deep-linking, tabbed switching, and accessible modal views.
- **Audited Data Integration:** Integrate public GitHub data with strict schema validation, offline baseline fallbacks, and explicit data boundaries.
- **Responsive and Accessible Layouts:** Provide responsive viewports from mobile screens to ultra-wide displays with zero horizontal overflow, keyboard navigation, and focus management.
- **Repeatable Verification:** Establish automated, deterministic testing and deployment procedures to verify system behavior across changes.

---

### 3. System Architecture

BLUEPRINT is built with a minimal runtime footprint, relying entirely on standardized web platforms without third-party runtime frameworks or heavy client-side dependencies:

- **HTML5:** Semantic document markup pre-rendering all 12 dossier sheets within a single cohesive document tree.
- **Modular CSS3:** Layered stylesheets separating architectural concerns, including theme tokens, engineering grids, component primitives, sheet layouts, and interactive telemetry badges.
- **Vanilla JavaScript (ES6+):** Lightweight client modules managing hash routing, sequential sheet navigation, modal dialogs, and keyboard accessibility.
- **JSON Telemetry:** Local data snapshots storing audited profile metrics, repository classifications, commit history, and milestone events.
- **JSON Schema (Draft-07):** Formal schema contracts governing the structure and types of all ingested telemetry data.
- **GitHub Pages:** Static site publication hosted directly from the repository.

The user interface is organized into 12 interconnected sheets sharing centralized navigation, keyboard shortcuts, and interactive modal dialogs:

| Sheet | Designation | Core Technical Scope |
| :---: | :--- | :--- |
| **01** | System Cover | Executive technical summary, CAD schematic projection, and specification metadata. |
| **02** | Biographical Data | Professional background, formal education, core disciplines, and timeline. |
| **03** | Development Stack | Audited language matrices, runtime environments, frameworks, and tools. |
| **04** | Project Architecture | Architectural classifications, component schematics, and interactive repository modals. |
| **05** | Live GitHub Activity | Snapshot telemetry metrics, commit frequency charts, and repository activity cards. |
| **06** | Contribution Analysis | Language composition ratios, repository velocity metrics, and commit cadence. |
| **07** | Research Laboratory | R&D initiatives covering spatial visualizers, simulation interfaces, and analytical scripts. |
| **08** | System Architecture | Multi-tier client/service data flow diagrams and runtime orchestration topology. |
| **09** | Learning Roadmap | Strategic technical progression trajectories for distributed systems and local inference. |
| **10** | Engineering Logbook | Chronological release milestones, snapshot telemetry logs, and category filtering. |
| **11** | Contact & Connections | Terminal dispatch interface, public channels, and cryptographic verification status. |
| **12** | Document Index | Master document index, audit records, design specifications, and schema metadata. |

---

### 4. Data Engineering and Integrity

The project incorporates a structured workflow for collecting and validating public GitHub data:

- **Public Data Collection:** Collects publicly available GitHub repository, profile, and event metrics via standard REST API endpoints.
- **JSON Snapshot Formatting:** Structures collected data into standardized JSON snapshots stored locally within the repository.
- **Strict Schema Validation:** Enforces structural integrity by validating all data snapshots against a formal JSON Schema Draft-07 specification prior to use.
- **Resilient Fallback Handling:** Provides guaranteed fallback behavior using validated offline baselines to ensure interface stability during network or API availability issues.
- **Claim Integrity Auditing:** Conducts rigorous reviews to explicitly separate implemented functionality from planned, experimental, or unsupported capabilities.

> **Data Boundary Notice:** GitHub activity displayed through locally stored telemetry represents a point-in-time snapshot, not real-time or live synchronization.

---

### 5. Quality Assurance

System verification is conducted through a multi-tiered automated test suite. The final release verification reported passing results across all 158 assertions:

| Test Suite | Scope | Result | Status |
| :--- | :--- | ---:| :---: |
| Claim integrity | Document claims, links, schema, and privacy leak checks | 77/77 | **PASS** |
| Dossier integration | Sequential sheet navigation, deep links, and modal lifecycle | 23/23 | **PASS** |
| Data and telemetry | Sheet layout structure, CAD title blocks, and coordinates | 18/18 | **PASS** |
| Functional tests | Chrome DevTools Protocol telemetry updates and keyboard events | 24/24 | **PASS** |
| Responsive tests | Layout stability across 5 viewports (1920px, 1440px, 768px, 390px, 320px) | 5/5 | **PASS** |
| Browser interaction tests | Coordinate-based mouse dispatch, modal URL hydration, and focus traps | 11/11 | **PASS** |
| **Total** | **Comprehensive Regression Suite** | **158/158** | **100% PASS** |

An important test-harness improvement replaced arbitrary fixed sleep delays with deterministic readiness polling. By polling for document completion and DOM element availability before executing assertions, functional testing became fully repeatable and resilient against timing variations without requiring modifications to the application itself.

---

### 6. Production Engineering

BLUEPRINT is deployed as a static site via GitHub Pages, configured to publish from the `/docs` directory on the `main` branch.

During deployment verification, an asset-path issue was diagnosed: profile SVG assets located outside the published `/docs` directory were inaccessible on the live site, resulting in HTTP 404 responses.

The issue was resolved by placing copies of the required SVG assets directly inside `docs/assets/profile/`, while preserving the original root assets unchanged.

Production verification confirmed:

- **HTTP Status Checks:** Verified HTTP 200 OK responses across all deployed assets, stylesheets, scripts, and JSON data endpoints.
- **Cryptographic Parity:** Confirmed 100% bit-for-bit SHA-256 hash parity between local repository source files and published production resources.
- **Resource Accessibility:** Verified that all canonical production endpoints operate cleanly with zero browser console errors.

---

### 7. Release

- **Release Version:** `v1.0.0`
- **Release Commit:** [`54e98ee0c97b7e728b375f38b5b3ea35a7606f9f`](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/commit/54e98ee0c97b7e728b375f38b5b3ea35a7606f9f)
- **Git Tag:** Annotated tag `v1.0.0`
- **Production URL:** [https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/](https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/)

The project received a formal `READY WITH MINOR CONDITIONS` audit verdict during Phase 8.0 independent evaluation. Following deterministic test-harness stabilization and full 158/158 regression verification, the system was tagged, deployed, and certified as released and production verified.

---

### 8. Engineering Lessons

The development and auditing lifecycle of BLUEPRINT provided practical engineering experience in:

- **Modular Frontend Design:** Organizing complex web interfaces with pure CSS custom properties and semantic markup without framework lock-in.
- **Information Architecture:** Designing multi-sheet information systems with intuitive spatial and sequential navigation patterns.
- **Data Ingestion and Schema Contracts:** Structuring public API data into durable, schema-validated JSON snapshots with offline resiliency.
- **Deterministic Test Engineering:** Eliminating asynchronous race conditions in browser automation harnesses through condition-based readiness polling.
- **Deployment Mechanics:** Diagnosing static hosting publication boundaries, URL path resolutions, and asset co-location requirements.
- **Release Engineering:** Managing Git release provenance through annotated tags, clean commit histories, and verified committer identities.
- **Independent Production Auditing:** Performing end-to-end cryptographic and HTTP verification to validate production parity against local baselines.

---

### 9. Future Development

Potential future improvements identified for subsequent releases include:

- **Automated GitHub Telemetry Synchronization:** Implementing scheduled GitHub Actions workflows to automate snapshot ingestion and schema validation.
- **Expanded CI/CD Integration:** Adding automated pull-request validation pipelines for test suite execution and responsive visual diffing.
- **Maintenance and Verification Automation:** Automating link health checks and scheduled production uptime audits.

> **Scope Clarification:** The items listed above represent future development opportunities and must not be presented as completed V1.0.0 functionality.

---

**BLUEPRINT v1.0.0 — A production-audited interactive engineering portfolio.**
