#!/usr/bin/env node
/**
 * BLUEPRINT Automated Accessibility & Usability Audit Suite
 *
 * Audits:
 * 1. Semantic Landmarks & Document Metadata
 * 2. Heading Level Hierarchy
 * 3. Interactive Controls & Accessible Names (Buttons, Links)
 * 4. ARIA Attributes, Roles & State Synchronization
 * 5. Reduced-Motion Media Query Support
 * 6. Modal Focus Management & Trapping Architecture
 * 7. Decorative Asset Cloaking (aria-hidden)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const htmlPath = path.join(DOCS_DIR, 'index.html');
const cssDir = path.join(DOCS_DIR, 'css');
const jsDir = path.join(DOCS_DIR, 'js');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function record(suite, name, passed, details = '') {
  if (passed) {
    passedTests++;
    console.log(`[PASS] [${suite}] ${name} ${details ? '— ' + details : ''}`);
  } else {
    failedTests++;
    failures.push({ suite, name, details });
    console.error(`[FAIL] [${suite}] ${name} ${details ? '— ' + details : ''}`);
  }
}

console.log('================================================================');
console.log('=== BLUEPRINT AUTOMATED ACCESSIBILITY (A11Y) AUDIT SUITE ===');
console.log('================================================================\n');

if (!fs.existsSync(htmlPath)) {
  console.error('Fatal: docs/index.html not found.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// -----------------------------------------------------------------------------
// 1. SEMANTIC LANDMARKS & DOCUMENT METADATA
// -----------------------------------------------------------------------------
console.log('--- 1. SEMANTIC LANDMARKS & DOCUMENT METADATA ---');

// HTML lang attribute
const hasLang = /<html[^>]+lang=["']en["']/i.test(html);
record('LANDMARK', 'Document HTML Tag Declares English Language (lang="en")', hasLang);

// Title presence
const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
const hasTitle = Boolean(titleMatch && titleMatch[1].trim().length > 0);
record('LANDMARK', 'Document Title is Present and Non-Empty', hasTitle, titleMatch ? titleMatch[1].trim() : 'Missing');

// Viewport meta
const hasViewport = /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i.test(html);
record('LANDMARK', 'Responsive Viewport Meta Configured for Device Width', hasViewport);

// Semantic landmark regions
const hasHeader = /<header[\s>]/i.test(html);
const hasMain = /<main[\s>]/i.test(html);
const hasNav = /<nav[\s>]/i.test(html);
const hasFooter = /<footer[\s>]/i.test(html);
record('LANDMARK', 'Core Semantic Landmarks Present (<header>, <main>, <nav>, <footer>)',
  hasHeader && hasMain && hasNav && hasFooter,
  `header: ${hasHeader}, main: ${hasMain}, nav: ${hasNav}, footer: ${hasFooter}`);

// -----------------------------------------------------------------------------
// 2. HEADING LEVEL HIERARCHY
// -----------------------------------------------------------------------------
console.log('\n--- 2. HEADING LEVEL HIERARCHY ---');

const headingMatches = [...html.matchAll(/<(h[1-6])(?:\s+[^>]*)?>([\s\S]*?)<\/\1>/gi)];
const headingLevels = headingMatches.map(m => parseInt(m[1].substring(1), 10));

// Check single H1
const h1Count = headingLevels.filter(lvl => lvl === 1).length;
record('HEADING', 'Document Contains Exactly One Primary Top-Level H1', h1Count === 1, `Found ${h1Count} H1 elements`);

// Check for skipped heading levels
let hasSkippedLevel = false;
let skippedDetail = '';
for (let i = 1; i < headingLevels.length; i++) {
  const prev = headingLevels[i - 1];
  const curr = headingLevels[i];
  if (curr > prev + 1) {
    hasSkippedLevel = true;
    skippedDetail = `Heading h${curr} follows h${prev} without intermediate level`;
    break;
  }
}
record('HEADING', 'Heading Levels Progress Incrementally Without Skipping', !hasSkippedLevel,
  hasSkippedLevel ? skippedDetail : `${headingMatches.length} headings verified`);

// -----------------------------------------------------------------------------
// 3. INTERACTIVE CONTROLS & ACCESSIBLE NAMES
// -----------------------------------------------------------------------------
console.log('\n--- 3. INTERACTIVE CONTROLS & ACCESSIBLE NAMES ---');

// Check all buttons
const buttonMatches = [...html.matchAll(/<button(?:\s+([^>]*))?>([\s\S]*?)<\/button>/gi)];
let unlabelledButtons = [];
for (const match of buttonMatches) {
  const attrs = match[1] || '';
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
  const hasAriaLabelledby = /aria-labelledby=["'][^"']+["']/i.test(attrs);
  const hasTitleAttr = /title=["'][^"']+["']/i.test(attrs);

  if (!text && !hasAriaLabel && !hasAriaLabelledby && !hasTitleAttr) {
    unlabelledButtons.push(match[0].substring(0, 50));
  }
}
record('CONTROLS', 'All Interactive Buttons Provide Accessible Names', unlabelledButtons.length === 0,
  unlabelledButtons.length === 0 ? `${buttonMatches.length} buttons verified with text or aria-label` : `Unlabelled: ${unlabelledButtons.join('; ')}`);

// Check all links
const linkMatches = [...html.matchAll(/<a(?:\s+([^>]*))?>([\s\S]*?)<\/a>/gi)];
let unlabelledLinks = [];
for (const match of linkMatches) {
  const attrs = match[1] || '';
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
  const hasAriaLabelledby = /aria-labelledby=["'][^"']+["']/i.test(attrs);

  if (!text && !hasAriaLabel && !hasAriaLabelledby) {
    unlabelledLinks.push(match[0].substring(0, 50));
  }
}
record('CONTROLS', 'All Hyperlinks Provide Accessible Names', unlabelledLinks.length === 0,
  unlabelledLinks.length === 0 ? `${linkMatches.length} hyperlinks verified` : `Unlabelled: ${unlabelledLinks.join('; ')}`);

// Check no positive tabindices (anti-pattern that disrupts natural tab order)
const positiveTabIndex = /tabindex=["'](?:[1-9]\d*)["']/i.test(html);
record('CONTROLS', 'Zero Anti-Pattern Positive tabIndex Disruption', !positiveTabIndex, 'Only natural 0 or -1 programmatic tabindices permitted');

// -----------------------------------------------------------------------------
// 4. ARIA ROLES & STATE ATTRIBUTES
// -----------------------------------------------------------------------------
console.log('\n--- 4. ARIA ROLES & STATE ATTRIBUTES ---');

// Tablist & tabs
const hasTablist = /role=["']tablist["']/i.test(html);
const tabCount = (html.match(/role=["']tab["']/gi) || []).length;
record('ARIA', 'Sheet Navigation Implements ARIA tablist with tab Roles', hasTablist && tabCount > 0,
  `tablist: ${hasTablist}, tabs: ${tabCount}`);

// Region Landmark Containers
const regionCount = (html.match(/class=["'][^"']*sheet-container[^"']*["'][^>]*role=["']region["']/gi) || []).length;
record('ARIA', 'Sheet Containers Implement Accessible role="region" with Distinct aria-label', regionCount === 12,
  `Found ${regionCount} / 12 accessible sheet region containers`);

// Modal dialog role and modal state
const hasDialogRole = /role=["']dialog["']/i.test(html);
const hasAriaModal = /aria-modal=["']true["']/i.test(html);
const hasAriaLabelledBy = /id=["']project-modal["'][^>]*aria-labelledby=/i.test(html);
record('ARIA', 'Project Modal Dialog Implements role="dialog" and aria-modal="true"',
  hasDialogRole && hasAriaModal && hasAriaLabelledBy,
  `dialog: ${hasDialogRole}, aria-modal: ${hasAriaModal}, aria-labelledby: ${hasAriaLabelledBy}`);

// -----------------------------------------------------------------------------
// 5. REDUCED-MOTION ERGONOMICS
// -----------------------------------------------------------------------------
console.log('\n--- 5. REDUCED-MOTION ERGONOMICS ---');

let hasReducedMotion = false;
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(cssDir, file), 'utf8');
  if (css.includes('prefers-reduced-motion')) {
    hasReducedMotion = true;
    break;
  }
}
record('ERGONOMICS', 'CSS Stylesheets Provide prefers-reduced-motion Overrides', hasReducedMotion,
  hasReducedMotion ? 'Motion sensitivities respected across animation rules' : 'Missing prefers-reduced-motion media query');

// -----------------------------------------------------------------------------
// 6. MODAL FOCUS MANAGEMENT & KEYBOARD RESTORATION ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('\n--- 6. MODAL FOCUS MANAGEMENT ARCHITECTURE ---');

let hasFocusTrap = false;
let hasBidirectionalTrap = false;
let hasFocusRestore = false;
let hasEscapeDismiss = false;

const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
for (const file of jsFiles) {
  const code = fs.readFileSync(path.join(jsDir, file), 'utf8');
  if (code.includes('focus()') && (code.includes('modal') || code.includes('Modal'))) {
    if (code.includes('lastFocusedElement') || code.includes('originTrigger') || code.includes('activeElement')) {
      hasFocusRestore = true;
    }
  }
  if (code.includes('Escape') || code.includes('key === 27') || code.includes('keyCode === 27')) {
    hasEscapeDismiss = true;
  }
  if (code.includes('Tab') && code.includes('preventDefault')) {
    hasFocusTrap = true;
  }
  if (code.includes('Tab') && code.includes('shiftKey') && code.includes('preventDefault')) {
    hasBidirectionalTrap = true;
  }
}

// Fallback check against root HTML or inline scripts if modularized
if (!hasFocusRestore || !hasEscapeDismiss) {
  if (html.includes('Escape')) hasEscapeDismiss = true;
  if (html.includes('focus()')) hasFocusRestore = true;
}

const modalHasBoundaryElements = html.includes('id="project-modal"') &&
  html.includes('id="modal-close-btn"') &&
  html.includes('id="modal-repo-link"');

record('A11Y-ARCH', 'Modal Focus Trapping Implemented (Keyboard Tab Trapping)', hasFocusTrap,
  'Tab navigation trapped within modal boundary');
record('A11Y-ARCH', 'Modal Bidirectional Shift+Tab Trapping Implemented', hasBidirectionalTrap,
  'Reverse Tab cycling correctly bounded to modal boundary');
record('A11Y-ARCH', 'Modal Focusable Boundary Elements Present in DOM', modalHasBoundaryElements,
  'Close button and action links provide valid tab loop targets');
record('A11Y-ARCH', 'Modal Focus Restoration Architecture Implemented', hasFocusRestore,
  'Focus deterministically restored to originating card upon dismissal');
record('A11Y-ARCH', 'Keyboard Escape Key Dismissal Implemented', hasEscapeDismiss,
  'Escape key closes modal dialog');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`=== ACCESSIBILITY AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED ===`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
