# BLUEPRINT — FORGE RUNTIME
## MASTER PROJECT SPECIFICATION
### AGY Autonomous Development Instructions

**Project Owner:** Sanchayan Saha  
**GitHub Username:** sahasanchayan44-tech  
**GitHub Profile:** https://github.com/sahasanchayan44-tech  
**Local Workspace:** ~/Projects/BLUEPRINT  
**Target Repository:** sahasanchayan44-tech/sahasanchayan44-tech  
**Design Identity:** BLUEPRINT / FORGE RUNTIME  
**Deployment:** GitHub Pages

---

# 01. PROJECT OBJECTIVE

Build a complete, visually sophisticated, interactive GitHub developer profile and engineering portfolio.

This is not a conventional developer portfolio.

It must resemble a technical engineering blueprint, systems architecture document, and interactive software engineering dossier.

The design must reproduce the visual characteristics of the supplied Forge Runtime reference:

- Deep midnight navy background.
- Subtle engineering grid.
- Electric cyan technical linework.
- Large pale-blue typography.
- Asymmetric editorial composition.
- Technical diagrams.
- Dashed engineering frames.
- Document IDs and revision numbers.
- Sheet numbering.
- Measurement indicators.
- Structured technical metadata.

The website should feel like an actual engineered product.

The GitHub README will serve as the static cover sheet.

The GitHub Pages website will contain the complete interactive experience.

---

# 02. IMPORTANT ACCOUNT INFORMATION

Use only:

GitHub username: `sahasanchayan44-tech`

Profile:

https://github.com/sahasanchayan44-tech

Target profile repository:

`sahasanchayan44-tech/sahasanchayan44-tech`

The previous username `sahasanchayan44` is incorrect for this implementation.

The local working directory is:

`~/Projects/BLUEPRINT`

Do not create another workspace.

Do not modify:

- ~/Projects/LIFEOS
- ~/Projects/StorageGuardian
- ~/Projects/sanchayan-personal-website

These are separate projects.

---

# 03. INITIAL AUDIT — MANDATORY

Before coding, inspect the existing directory.

Execute:

```bash
pwd
ls -la
find . -maxdepth 3 -type f
git status
git remote -v
gh auth status
gh api user --jq .login
```

Verify that the authenticated GitHub account is `sahasanchayan44-tech`.

Inspect the target GitHub profile repository.

Determine:

- Whether it exists.
- Whether it already contains files.
- Whether the local directory is already a Git repository.
- Whether there are existing assets or source files.
- Whether any existing work must be preserved.

Inspect public GitHub repositories and identify verified technologies, projects, languages, and activity.

Do not invent personal details or project information.

Create:

- `PROJECT_AUDIT.md`
- `IMPLEMENTATION_PLAN.md`

Document all findings.

Do not overwrite files, create a remote repository, push commits, or deploy without explicit approval.

---

# 04. VISUAL DESIGN SYSTEM

Use the following design tokens:

```css
:root {
  --bg: #0B1730;
  --bg-deep: #091329;
  --bg-panel: #101F3B;

  --cyan: #42CCF5;
  --cyan-bright: #55D5FA;

  --text-primary: #EDF3FF;
  --text-secondary: #A9BEDD;
  --text-muted: #66809F;

  --border: #294563;
  --border-cyan: #42BDE9;

  --success: #63D9A1;
  --warning: #E9BE69;
}
```

### Engineering grid

- Major grid: 40px.
- Minor grid: 8px.
- Very low-opacity cyan lines.
- Consistent grid positioning.
- Optional slow background animation.

### Typography

Use:
- Inter for large headings and readable body text.
- JetBrains Mono for technical annotations.
- IBM Plex Mono for metadata.

Use open-source fonts and sensible fallbacks.

### Technical components

Create reusable components for:

- Dashed frames.
- Registration marks.
- Dimension lines.
- Measurement arrows.
- Scale indicators.
- Technical annotations.
- Sheet metadata.
- Document headers.
- Schematic connectors.
- Coordinate markers.
- Status indicators.

Do not use generic glassmorphism, purple gradients, cyberpunk styling, or conventional portfolio cards.

---

# 05. WEBSITE ARCHITECTURE

Build two connected experiences.

## A. GitHub Profile README

Create a static blueprint cover sheet.

Include:

1. Blueprint SVG banner.
2. Name and professional identity.
3. Short introduction.
4. System architecture illustration.
5. Technical inventory.
6. Featured projects.
7. GitHub activity graphics.
8. Link to the full website.

Use GitHub-compatible Markdown and static SVG assets.

Do not use JavaScript or arbitrary custom CSS in the README.

Do not depend on SVG animation working in GitHub's image renderer.

## B. GitHub Pages Website

Build the full interactive website inside:

`docs/`

Use:

- HTML5.
- CSS3.
- JavaScript.
- SVG.
- JSON data.
- GitHub Actions.

Prefer vanilla JavaScript.

Do not introduce a large framework unless there is a documented reason.

The website must work as a static GitHub Pages deployment.

---

# 06. THE TWELVE ENGINEERING SHEETS

Create twelve connected document sheets.

Every sheet must include document metadata, sheet numbering, consistent styling, and navigation.

## SHEET 01 — SYSTEM COVER

This is the most important page.

Reproduce the supplied Forge Runtime cover composition.

LEFT:
- Small technical annotation.
- Massive title: SANCHAYAN SAHA.
- Short professional identity statement.
- Concise introduction.
- Technical metadata.

RIGHT:
- Large engineering schematic.
- Dashed cyan boundary.
- Three input modules.
- Central core/scheduler.
- Output module.
- Connected lines.
- Scale indicator.
- Measurement annotations.

TOP:
- BLUEPRINT / PERSONAL SYSTEM.
- Document ID.
- Version.
- Revision.

BOTTOM:
- Author.
- Date.
- Scale.
- Sheet number.
- Status.

The layout must be asymmetric, spacious, and visually precise.

## SHEET 02 — BIOGRAPHICAL DATA

Create a structured biography sheet.

Include:
- Introduction.
- Technical interests.
- Research interests.
- Development philosophy.
- Education, if verified.
- Current status, if verified.
- Location, if confirmed.

Use engineering-style property panels.

## SHEET 03 — DEVELOPMENT STACK

Create a technical parts inventory.

Categories:
- Programming languages.
- Frontend.
- Backend.
- Databases.
- Data science.
- Machine learning.
- Cloud computing.
- DevOps.
- Electronics.
- Embedded systems.
- Research tools.

Classify technologies as:

- ACTIVE
- WORKING KNOWLEDGE
- LEARNING
- EXPERIMENTAL

Use actual verified information.

Never invent proficiency percentages.

## SHEET 04 — PROJECT ARCHITECTURE

Build a project registry using actual GitHub repositories.

Each project must have:
- Project ID.
- Name.
- Description.
- Repository URL.
- Technologies.
- Languages.
- Development status.
- Last updated date.
- Architecture diagram.
- Key capabilities.

Feature important projects.

Do not invent missing projects.

## SHEET 05 — LIVE GITHUB ACTIVITY

Display real GitHub information:

- Public repositories.
- Followers.
- Following.
- Stars.
- Forks.
- Recent public commits.
- Repository activity.
- Languages.
- Contributions where available.

Show:
- Last updated time.
- Data source.
- Loading state.
- Error state.
- Stale data state.

## SHEET 06 — CONTRIBUTION ANALYSIS

Create:
- Contribution heatmap.
- Monthly activity.
- Weekly activity.
- Language distribution.
- Repository activity.
- Growth visualizations.

Use real data and clearly describe its limitations.

## SHEET 07 — RESEARCH & EXPERIMENTS

Create a research laboratory sheet.

Investigate verified projects involving:
- Space technology.
- Satellite data.
- Machine learning.
- Data science.
- Electronics.
- Embedded systems.
- Cloud computing.
- Software architecture.

Include experiment ID, objective, tools, status, and documentation link.

Do not publish private or unapproved information.

## SHEET 08 — SYSTEM ARCHITECTURE

Create connected technical diagrams showing actual relationships between:

- Languages.
- Frameworks.
- APIs.
- Databases.
- Cloud systems.
- Data sources.
- Development environments.
- Deployment systems.

Use original SVG illustrations.

## SHEET 09 — LEARNING ROADMAP

Show:
- Currently learning.
- Next objectives.
- Long-term technical interests.
- Completed milestones where verified.

Distinguish plans from completed achievements.

## SHEET 10 — ENGINEERING LOGBOOK

Create a chronological development log using verified public GitHub activity.

Show selected:
- Projects.
- Releases.
- Repository updates.
- Commits.
- Development milestones.

Do not misrepresent repository timestamps.

## SHEET 11 — CONTACT

Show confirmed public links only:

- GitHub.
- LinkedIn, if provided.
- Professional email, if provided.
- Personal website, if available.

Never invent contact details.

## SHEET 12 — DOCUMENT INDEX

Create a navigation index for all twelve sheets.

Include:
- Sheet number.
- Title.
- Description.
- Navigation link.
- Revision.
- Status.

---

# 07. INTERACTIVITY AND ANIMATIONS

Implement:

### Navigation
- Persistent document navigation.
- Active sheet indicator.
- Previous and next controls.
- Direct sheet links.
- Keyboard navigation.
- Mobile navigation.

### Interactive schematic

When a user selects a diagram node:

- Highlight the node.
- Display its description.
- Identify connected technologies or projects.
- Allow navigation to the relevant sheet.

### Project explorer

Implement:
- Project selection.
- Technology filters.
- Status filters.
- Project details.
- Repository links.
- Architecture diagrams.

### Animations

Use:
- SVG line drawing.
- Subtle grid movement.
- Connector animations.
- Sheet transitions.
- Status indicators.
- Small hover effects.

Respect `prefers-reduced-motion`.

Do not make the website unnecessarily animated.

---

# 08. GITHUB API AND DYNAMIC DATA

Use GitHub Actions to collect data.

Create:

```text
docs/data/
  profile.json
  repositories.json
  activity.json
  languages.json
  contributions.json
  metadata.json
```

Retrieve verified public GitHub data.

Use REST API and GraphQL where appropriate.

Requirements:

- Handle pagination.
- Handle API rate limits.
- Validate responses.
- Avoid duplicate repositories.
- Handle missing data.
- Sanitize untrusted descriptions.
- Keep previous successful data if an update fails.
- Show synchronization timestamps.

Do not expose credentials in frontend JavaScript.

Do not assume the REST profile endpoint contains contribution history.

Use authenticated GraphQL where appropriate and authorized.

Never fabricate activity.

---

# 09. GITHUB ACTIONS

Create:

```text
.github/
  scripts/
    fetch-github-data.js
    generate-profile-assets.js
    validate-data.js

  workflows/
    update-profile.yml
    deploy-pages.yml
```

Automate:

- Scheduled data retrieval.
- Manual updates.
- JSON generation.
- SVG generation.
- Validation.
- GitHub Pages deployment.

Use current maintained GitHub Actions.

Use minimum permissions.

Never expose secrets.

Do not rely on a second workflow being triggered by a GITHUB_TOKEN-generated push.

Prefer one validated generation and deployment workflow.

---

# 10. FILE STRUCTURE

Use this as the target architecture, adapting it to the existing workspace.

```text
BLUEPRINT/
│
├── BLUEPRINT_MASTER_PROMPT.md
├── PROJECT_AUDIT.md
├── IMPLEMENTATION_PLAN.md
├── CHANGELOG.md
├── README.md
├── package.json
├── .gitignore
│
├── references/
│   ├── forge-runtime-cover.png
│   └── ryme-editor.png
│
├── assets/
│   ├── profile-cover-dark.svg
│   ├── profile-cover-light.svg
│   └── system-diagram.svg
│
├── docs/
│   ├── index.html
│   ├── 404.html
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── data/
│
├── .github/
│   ├── scripts/
│   └── workflows/
│
└── tests/
```

Do not create unnecessary empty files.

---

# 11. RESPONSIVE DESIGN

Test:

- 1920px.
- 1440px.
- 1024px.
- 768px.
- 390px.
- 320px.

Desktop:
- Asymmetric two-column hero.
- Large typography.
- Diagram on right.

Tablet:
- Rebalanced composition.
- Reduced diagram size.

Mobile:
- Single-column layout.
- Title above diagram.
- Collapsible navigation.
- No horizontal overflow.
- Readable annotations.
- Touch-friendly controls.

---

# 12. ACCESSIBILITY AND PERFORMANCE

Target WCAG 2.2 AA.

Implement:
- Semantic HTML.
- Keyboard navigation.
- Visible focus.
- Sufficient contrast.
- Alternative text.
- Reduced-motion support.
- Accessible controls.

Performance:
- Minimize dependencies.
- Optimize SVG.
- Lazy-load noncritical visuals.
- Avoid unnecessary external scripts.
- Minimize layout shifts.

---

# 13. IMPLEMENTATION PHASES

Execute in stages.

## PHASE 0 — AUDIT

Inspect the workspace and GitHub account.

Create:
- PROJECT_AUDIT.md
- IMPLEMENTATION_PLAN.md

Report findings.

Wait for approval before remote creation, overwrites, or destructive changes.

## PHASE 1 — COVER DESIGN

Implement only Sheet 01.

Create:
- Engineering grid.
- Typography.
- Metadata.
- Dashed frames.
- SVG system diagram.
- Responsive composition.

Take screenshots.

Compare with the supplied Forge Runtime reference.

Refine before proceeding.

## PHASE 2 — ALL TWELVE SHEETS

Implement the complete document system.

## PHASE 3 — INTERACTION

Build navigation, diagram interaction, project explorer, and animations.

## PHASE 4 — LIVE DATA

Integrate GitHub API and generated JSON.

## PHASE 5 — README

Create the static GitHub profile cover.

Verify GitHub rendering.

## PHASE 6 — AUTOMATION

Create and test GitHub Actions.

## PHASE 7 — QUALITY ASSURANCE

Validate:
- HTML.
- CSS.
- JavaScript.
- JSON.
- SVG.
- Links.
- Accessibility.
- Responsiveness.
- Browser console.
- Workflows.

## PHASE 8 — DEPLOYMENT

Prepare GitHub Pages.

Do not publish without explicit approval.

---

# 14. SECURITY AND CHANGE MANAGEMENT

Mandatory:

1. Never delete unrelated work.
2. Never modify LIFEOS.
3. Never modify StorageGuardian.
4. Never modify my personal website.
5. Never use the wrong GitHub account.
6. Never overwrite an existing remote without approval.
7. Never force-push.
8. Never expose credentials.
9. Never invent achievements.
10. Never deploy without approval.
11. Preserve the master prompt.
12. Keep rollback instructions.
13. Inspect Git status before changes.
14. Review diffs before committing.

The local BLUEPRINT directory is the working environment.

The target GitHub profile repository must be checked before connecting.

Preserve existing remote content.

---

# 15. FINAL DELIVERABLES

Deliver:

- Complete GitHub profile README.
- Twelve-sheet interactive website.
- Original SVG illustrations.
- Interactive diagrams.
- Project explorer.
- GitHub API integration.
- Dynamic activity graphics.
- GitHub Actions workflows.
- Responsive design.
- Accessibility support.
- Documentation.
- Desktop screenshots.
- Mobile screenshots.
- Testing report.
- Deployment instructions.
- Rollback instructions.

Create:

`FINAL_PROJECT_REPORT.md`

Include:
- Implemented features.
- Files changed.
- Tests performed.
- Results.
- Remaining issues.
- Deployment status.
- Manual approval requirements.

Never claim an untested feature is complete.

---

# 16. FINAL DESIGN PHILOSOPHY

The website should feel like:

An architectural engineering dossier.

A systems research portfolio.

A technical operating manual.

A living software blueprint.

A personal engineering command center.

Visual precision is more important than adding unnecessary widgets.

Functionality is more important than decorative animations.

Accuracy is more important than impressive but fabricated statistics.

Every sheet must belong to one coherent design system.

The opening cover must be visually memorable.

The complete experience must feel like a professionally engineered product.

---

# INITIAL EXECUTION INSTRUCTION

BEGIN WITH PHASE 0 — AUDIT.

Inspect the existing `~/Projects/BLUEPRINT` workspace.

Verify the GitHub account `sahasanchayan44-tech`.

Discover the target profile repository.

Inspect existing content.

Create the project audit and implementation plan.

Do not create remote repositories, overwrite files, push commits, or deploy anything without explicit approval.

Present the audit findings and proposed implementation plan before proceeding to Phase 1.
