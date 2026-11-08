# BLUEPRINT / FORGE RUNTIME — IMPLEMENTATION PLAN
**Document ID:** BP-PLAN-2026-REV01  
**Project Owner:** Sanchayan Saha (`sahasanchayan44-tech`)  
**Workspace:** `/home/sanchayan/Projects/BLUEPRINT`  
**Target Repository:** `sahasanchayan44-tech/sahasanchayan44-tech`  
**Specification:** `BLUEPRINT_MASTER_PROMPT.md`  

---

## 1. Project Vision & Architecture Strategy

The **BLUEPRINT / FORGE RUNTIME** system transforms the developer profile and portfolio of Sanchayan Saha into an architectural engineering dossier, systems manual, and interactive technical command center.

### 1.1 Architecture Decisions
1. **Zero-Bloat Static Engine:** Built with native HTML5, modular CSS3 Custom Properties, and ES6+ JavaScript. No bloated single-page framework overhead; sub-second cold load, zero build step failures on GitHub Pages.
2. **Dual-Surface Delivery:**
   - **Static Cover Sheet (`README.md`):** Engineered for GitHub's native Markdown renderer. Uses crisp vector SVG banners, architecture schematics, and live SVG stats without JavaScript.
   - **Interactive Dossier (`docs/`):** A 12-sheet technical system hosted on GitHub Pages with interactive vector schematics, project filtering, data synchronization, and keyboard navigation.
3. **Verified Data Pipeline:** Automation scripts in `.github/scripts/` retrieve live GitHub data (REST + GraphQL) and generate structured JSON files (`docs/data/*.json`) and static SVGs, checked in safely with minimal token permissions.

---

## 2. Phase-by-Phase Roadmap

### PHASE 0: Audit & Technical Discovery (COMPLETED)
- [x] Inspect `/home/sanchayan/Projects/BLUEPRINT` and existing files.
- [x] Verify authenticated GitHub CLI identity (`sahasanchayan44-tech`).
- [x] Query and verify public repositories and active technologies.
- [x] Verify target repository `sahasanchayan44-tech/sahasanchayan44-tech` status (does not exist yet).
- [x] Confirm environment boundaries (preserve `LIFEOS`, `StorageGuardian`, and personal website).
- [x] Create `PROJECT_AUDIT.md` and `IMPLEMENTATION_PLAN.md`.
- [x] Await user approval before proceeding to Phase 1.

---

### PHASE 1: System Cover Design (Sheet 01 Prototype)
**Objective:** Perfect the foundational design system and reproduce the Forge Runtime cover sheet aesthetic before building out subsequent sheets.

**Deliverables:**
1. **Core Design System (`docs/css/blueprint-theme.css`):**
   - Palette tokens (`--bg: #0B1730`, `--bg-deep: #091329`, `--cyan: #42CCF5`, `--cyan-bright: #55D5FA`, `--border: #294563`, `--border-cyan: #42BDE9`).
   - Typography setup: Inter (display/headings), JetBrains Mono (technical linework), IBM Plex Mono (metadata).
2. **Engineering Grid System (`docs/css/engineering-grid.css`):**
   - 40px major grid and 8px minor grid pattern in SVG/CSS background.
   - Coordinate markers, registration crosshairs, and document frame borders.
3. **Component Kit (`docs/css/components.css`):**
   - Dashed technical frames (`border: 1px dashed var(--border-cyan)`).
   - Technical metadata badges, revision indicators, document IDs.
   - Measurement arrows and dimension callout indicators.
4. **Sheet 01 Layout (`docs/index.html`):**
   - **Top Bar:** Document ID (`SYS-SPEC-2026`), Sheet Number (`01/12`), Project Title (`BLUEPRINT / FORGE RUNTIME`), System Status indicator.
   - **Left Column:** Technical annotation, large typography (`SANCHAYAN SAHA`), professional identity dossier, core principles, system status.
   - **Right Column:** Handcrafted SVG architectural schematic featuring input modules, central execution core/scheduler, output interface, scale indicators, and measurement markers.
   - **Bottom Bar:** Author, timestamp, scale (`1:1 SYS`), revision, navigation teaser.
5. **Responsive Validation:**
   - Desktop (1920px, 1440px), Tablet (1024px, 768px), Mobile (390px, 320px).

---

### PHASE 2: Twelve Engineering Sheets Implementation
**Objective:** Construct the remaining 11 modular document sheets following the uniform engineering format.

- **Sheet 01 — System Cover:** Architectural overview and personal identity.
- **Sheet 02 — Biographical Data:** Systems background, technical interests, verified education/status, engineering philosophy.
- **Sheet 03 — Development Stack:** Parts inventory categorized by Languages, AI/ML, Frontend, Backend, Databases, DevOps, and Embedded Systems with verified operational states (`ACTIVE`, `WORKING KNOWLEDGE`, `LEARNING`, `EXPERIMENTAL`).
- **Sheet 04 — Project Architecture:** Technical registry featuring verified projects (`portfolio`, `exam-oracle-ai`, `neuroverse`, `chandrayaan-4.0`, `sunapse-android`, `synapse`, `aria`, `study-manager`, `admin-panel`) with architecture diagrams, repository links, and tech stacks.
- **Sheet 05 — Live GitHub Activity:** Real-time synchronized repository metrics, star counts, fork statistics, and sync timestamps.
- **Sheet 06 — Contribution Analysis:** Activity distribution, language percentage charts, and repository update metrics.
- **Sheet 07 — Research & Experiments:** R&D lab records detailing work in multimodal AI, 3D neural visualization, space technology simulation, and local LLM orchestration.
- **Sheet 08 — System Architecture:** High-level interconnectivity diagram linking APIs, UI frameworks, database persistence, and container runtimes.
- **Sheet 09 — Learning Roadmap:** Forward-looking technical radar differentiating active exploration from confirmed milestones.
- **Sheet 10 — Engineering Logbook:** Chronological engineering timeline sourced from verified GitHub commits and milestones.
- **Sheet 11 — Contact:** Verified contact channels, public GitHub links, and professional connection protocols.
- **Sheet 12 — Document Index:** Master directory with sheet numbers, document codes, revision timestamps, and quick-jump links.

---

### PHASE 3: Interactivity, Navigation & Controls
**Objective:** Bring the technical dossier to life with intuitive, responsive, and accessible interactions.

**Key Features:**
1. **Dossier Navigation Controller (`docs/js/navigation.js`):**
   - Persistent sheet header and bottom dock.
   - Previous/Next sheet controls, numeric direct jumpers, and modal index sheet.
   - URL hash routing (`#sheet-01` to `#sheet-12`) with history state support.
   - Full keyboard navigation (`ArrowRight`, `ArrowLeft`, `Home`, `End`, `1-9`).
2. **Interactive Schematic Explorer (`docs/js/schematic-interact.js`):**
   - Click/hover inspection of diagram nodes.
   - Node telemetry popup displaying technology stack, connected sub-systems, and related projects.
   - Direct link from schematic nodes to corresponding project sheets.
3. **Project Registry Filter (`docs/js/project-explorer.js`):**
   - Real-time faceted filtering by technology (Python, TypeScript, React, Next.js, Docker, AI).
   - Search by project ID or keyword.
4. **Motion & Accessibility:**
   - Smooth linework animation using SVG `stroke-dashoffset`.
   - Full support for `prefers-reduced-motion` media queries.
   - ARIA roles, live regions, and WCAG 2.2 AA compliant focus traps.

---

### PHASE 4: Dynamic GitHub API & Data Layer
**Objective:** Provide a deterministic, resilient data layer that populates both the website and README.

**Implementation:**
1. **JSON Data Schema (`docs/data/`):**
   - `profile.json`: Profile metadata, verified avatar, stats.
   - `repositories.json`: Normalized repository catalog, language metrics, descriptions.
   - `activity.json`: Commit cadence and recent update events.
   - `languages.json`: Aggregated language distribution bytes and percentages.
   - `metadata.json`: Build timestamps, data integrity hashes, sync status.
2. **Data Hydration Engine (`docs/js/data-loader.js`):**
   - Asynchronous fetch with fallback to static bundled JSON if network fails.
   - Graceful loading skeleton and error states.
   - Sanitization of all descriptions to prevent XSS.

---

### PHASE 5: GitHub Profile README.md
**Objective:** Construct an extraordinary static blueprint cover sheet rendered natively by GitHub.

**Components:**
1. **Static Blueprint Banner (`assets/profile-cover-dark.svg`):**
   - High-resolution SVG banner reproducing the blueprint aesthetic.
   - Technical framing, document ID, registration marks, and identity header.
2. **Schematic Architecture Graphic (`assets/system-diagram.svg`):**
   - Pure vector diagram demonstrating systems architecture, inputs, and pipelines.
3. **Technical Markdown Composition:**
   - Identity dossier and bio.
   - Structured project matrix with direct repository links and tech badges.
   - Verified language and systems inventory.
   - Prominent link to the live interactive GitHub Pages experience.
4. **Compatibility Check:**
   - Strict adherence to GitHub's Markdown sanitization rules (no inline scripts, no foreign objects).

---

### PHASE 6: Automation & GitHub Actions
**Objective:** Automate data retrieval, static asset generation, and Pages deployment.

**Workflows & Scripts:**
1. **Data Harvester (`.github/scripts/fetch-github-data.js`):**
   - Queries GitHub REST and GraphQL APIs for user data, repos, and language bytes.
   - Normalizes and outputs valid JSON into `docs/data/`.
2. **Asset Generator (`.github/scripts/generate-profile-assets.js`):**
   - Dynamically updates SVG badge cards or activity stats.
3. **Validator (`.github/scripts/validate-data.js`):**
   - Asserts schema integrity and verifies non-empty payloads before deployment.
4. **Unified Deployment Workflow (`.github/workflows/deploy-pages.yml`):**
   - Triggers on push to `main` and scheduled cron (e.g., weekly).
   - Runs data fetch, validates payloads, builds static package, and deploys to GitHub Pages via `actions/deploy-pages@v4`.

---

### PHASE 7: Quality Assurance & Cross-Device Testing
**Objective:** Ensure perfection across visual, functional, performance, and accessibility standards.

**Checklist:**
- [ ] Responsive inspection: 1920px (4K/QHD), 1440px (Laptop), 1024px (iPad Pro), 768px (Tablet), 390px (iPhone), 320px (Compact Mobile).
- [ ] Accessibility: WCAG 2.2 AA audit (color contrast > 7:1, keyboard navigable, screen reader labels).
- [ ] Zero Console Errors: Strict JS linting and event listener cleanup.
- [ ] Link Integrity: Every repository link, sheet anchor, and external reference verified.
- [ ] Fallback Testing: Verification with disabled JavaScript (graceful degradation).

---

### PHASE 8: Deployment & Final Verification
**Objective:** Production release upon explicit user approval.

**Deployment Steps:**
1. Initialize git repository in `/home/sanchayan/Projects/BLUEPRINT`.
2. Prepare commit with complete codebase.
3. Request user approval to create/link `sahasanchayan44-tech/sahasanchayan44-tech`.
4. Configure GitHub Pages source to `docs/` or GitHub Actions.
5. Trigger initial deployment and verify live URL.
6. Generate comprehensive `FINAL_PROJECT_REPORT.md`.

---

## 3. Rollback & Safety Protocols

1. **Local Isolation:** All work is confined to `/home/sanchayan/Projects/BLUEPRINT`. No operations touch any external directory.
2. **Git Checkpoints:** Every phase will maintain clean, modular local commits before pushing to remotes.
3. **Non-Destructive Remote Ops:** If `sahasanchayan44-tech/sahasanchayan44-tech` is created, `git push --force` is strictly prohibited.
4. **Approval Gates:** Phase 0 completion, remote repository creation, and production deployments require explicit user sign-off.
