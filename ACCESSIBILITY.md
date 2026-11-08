# Accessibility Statement

**Project:** BLUEPRINT
**Document Classification:** Architectural & Usability Standard
**Document ID:** SAHA-BP-2026-A11Y
**Maintained by:** Sanchayan Saha ([sahasanchayan44-tech](https://github.com/sahasanchayan44-tech))

---

## 1. Accessibility Philosophy & Goals

BLUEPRINT is designed as an interactive technical engineering portfolio and CAD architectural dossier. Our accessibility objective is to ensure that all technical specifications, interactive schematics, project showcases, and telemetry visualizations are perceivable, operable, understandable, and robust for all users, including those who rely on keyboard navigation, screen readers, or specialized viewing preferences.

While BLUEPRINT embraces a distinctive midnight-navy engineering blueprint aesthetic, visual styling is never prioritized over usability, structural clarity, or navigational accessibility.

---

## 2. Keyboard Navigation & Focus Management

BLUEPRINT provides complete keyboard accessibility across all interactive surfaces without requiring mouse or touch input:

### Sequential & Spatial Navigation
- **`Tab` and `Shift + Tab`**: Navigate sequentially through interactive elements, including sheet tabs, action buttons, project cards, modal controls, and external hyperlinks. Visible, high-contrast focus rings clearly indicate active keyboard focus.
- **Arrow Keys (`ArrowRight` / `ArrowLeft`)**:
  - Global navigation controls allow users to advance or retreat through the 12 engineering sheets seamlessly.
  - Interactive schematic nodes on Sheet 01 can be cycled sequentially via arrow keys to inspect component telemetry.
- **`Escape` Key**: Dismisses open dialog windows (such as Sheet 04 project modals) and resets active schematic node inspections back to the default state.

### Modal Dialog Focus Trapping & Restoration
- When a project modal dialog opens on Sheet 04, keyboard focus is automatically trapped within the modal window, preventing focus from wandering into background document layers.
- Closing the modal (via the close button, clicking outside, or pressing `Escape`) deterministically restores keyboard focus to the originating trigger button that opened the modal, ensuring seamless continuity for screen-reader and keyboard-only users.

---

## 3. Semantic Structure & Screen Reader Support

BLUEPRINT is engineered using standard, semantic HTML5 elements to provide meaningful structural landmarks for assistive technologies:

- **Landmark Regions**: Structural content is partitioned into semantic regions (`<header>`, `<main>`, `<nav>`, `<article>`, `<section>`, and `<footer>`).
- **Heading Hierarchy**: A logical heading hierarchy (`<h1>` through `<h3>`) is strictly maintained across all 12 sheets to facilitate rapid screen-reader heading jumps.
- **ARIA Attributes & Roles**:
  - Tab controls use `role="tab"` and `role="tablist"` with synchronized `aria-selected` attributes.
  - Sheet containers use `role="tabpanel"`.
  - Project modals implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the modal title.
  - Interactive controls without visible text employ explicit `aria-label` descriptions.
  - Decorative graphical elements and vector registration marks use `aria-hidden="true"` to prevent screen reader clutter.

---

## 4. Visual Ergonomics & Interaction Patterns

- **Color Contrast**: Text typography (pale cyan `#b0e6ff`, high-contrast white `#f0f6fc`, and slate grey `#8b949e`) is balanced against the deep midnight navy background (`#080f1a` / `#0b1526`) to deliver comfortable reading contrast.
- **Reduced Motion Support**: The stylesheet honors user operating system preferences through CSS media queries:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  Users with vestibular motion sensitivities experience instantaneous transitions without decorative sliding or pulse animations.
- **Text Scaling**: Layout dimensions utilize relative units (`rem`, `%`) where appropriate, allowing browser zoom up to 200% without breaking text flow or overlapping interactive controls.

---

## 5. Responsive Design & Multi-Viewport Verification

BLUEPRINT layout architecture is verified across 5 distinct viewport breakpoints to guarantee zero horizontal document clipping or unexpected layout breakage:

- **Desktop CAD Breakpoint** (1920 × 1080)
- **Standard Desktop CAD** (1440 × 900)
- **Tablet CAD** (768 × 1024)
- **Mobile Handheld** (390 × 844)
- **Compact Mobile** (320 × 700)

Automated responsive audit harnesses (`tests/responsive-test.js` and `tests/full-dossier-test.js`) enforce zero horizontal overflow across all 12 sheets during regression testing.

---

## 6. Known Limitations & Technical Disclosures

In the spirit of engineering transparency, the following technical limitations are disclosed:

1. **Intricate SVG Vector Schematics**: Sheet 01 and Sheet 08 feature complex CAD vector schematics. While interactive nodes provide text-based telemetry readouts and keyboard cycling, the graphical paths themselves remain visual diagrams. Equivalent textual descriptions are supplied directly in the accompanying specification cards and table rows.
2. **Sheet 06 GraphQL Pipeline Preview**: The Sheet 06 contribution analysis pipeline includes static preview disclosures illustrating planned GraphQL telemetry integration, labeled explicitly as preview data.
3. **Formal Compliance Certification**: While BLUEPRINT is developed with rigorous accessibility and usability practices verified through automated browser test suites, a formal third-party WCAG 2.1 AAA audit has not been conducted. We do not claim certified compliance without independent external accreditation.

---

## 7. Reporting Accessibility Barriers & Feedback

We welcome feedback and reports on accessibility barriers encountered while using BLUEPRINT. If you experience difficulty accessing any content, navigating with assistive software, or utilizing keyboard controls, please let us know:

- **GitHub Issue Tracker**: File a [Bug Report](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/issues/new?template=bug_report.yml) describing the issue, including the assistive tool used, browser, and operating system.
- **GitHub Profile**: Reach out via the maintainer's profile at [https://github.com/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech).

We strive to address accessibility barriers in an ongoing effort to ensure our engineering dossier is welcoming and accessible to all.
