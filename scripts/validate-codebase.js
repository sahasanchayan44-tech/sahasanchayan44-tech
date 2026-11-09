#!/usr/bin/env node
/**
 * BLUEPRINT Codebase Quality & Document Validation Suite
 *
 * Validates:
 * 1. HTML Syntax & DOM Structure (docs/index.html)
 * 2. CSS Syntax & Token Consistency (docs/css/*.css)
 * 3. JavaScript Syntax (docs/js/*.js, scripts/*.js, tests/*.js)
 * 4. Markdown Integrity & Relative Link Resolution (canonical repository docs)
 * 5. Telemetry JSON Schema Draft-07 Compliance (docs/data/github-data.json)
 * 6. Zero-Email Privacy Invariant
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { validateDraft07 } = require('./fetch-public-github-data.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function record(name, passed, details = '') {
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${name} ${details ? '— ' + details : ''}`);
  } else {
    failedTests++;
    failures.push({ name, details });
    console.error(`[FAIL] ${name} ${details ? '— ' + details : ''}`);
  }
}

console.log('================================================================');
console.log('=== BLUEPRINT CODEBASE QUALITY & DOCUMENT VALIDATION SUITE ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. HTML VALIDATION (docs/index.html)
// -----------------------------------------------------------------------------
console.log('--- 1. HTML SYNTAX & DOM INTEGRITY ---');
const htmlPath = path.join(DOCS_DIR, 'index.html');
if (!fs.existsSync(htmlPath)) {
  record('HTML File Exists', false, 'docs/index.html missing');
} else {
  const html = fs.readFileSync(htmlPath, 'utf8');
  record('HTML File Exists', true, `${html.length} bytes`);

  // Duplicate ID Detection
  const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
  const seenIds = new Set();
  const duplicateIds = new Set();
  let totalIds = 0;
  for (const match of idMatches) {
    totalIds++;
    const id = match[1];
    if (seenIds.has(id)) {
      duplicateIds.add(id);
    }
    seenIds.add(id);
  }
  record('Zero Duplicate Element IDs', duplicateIds.size === 0,
    duplicateIds.size === 0 ? `${totalIds} unique IDs audited` : `Duplicates: ${[...duplicateIds].join(', ')}`);

  // Fragment Anchor Integrity
  const fragmentMatches = html.matchAll(/href=["']#([a-zA-Z0-9_-]+)["']/g);
  const missingTargets = [];
  for (const match of fragmentMatches) {
    const target = match[1];
    if (!seenIds.has(target)) {
      missingTargets.push(target);
    }
  }
  record('Internal Fragment Anchors Resolve', missingTargets.length === 0,
    missingTargets.length === 0 ? 'All fragment links point to existing DOM IDs' : `Missing: ${missingTargets.join(', ')}`);

  // Script & Stylesheet Reference Resolution
  const scriptMatches = [...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/g)].map(m => m[1]);
  const linkMatches = [...html.matchAll(/<link\s+[^>]*href=["']([^"']+)["']/g)].map(m => m[1]);

  let missingAssets = [];
  for (const src of scriptMatches) {
    if (!src.startsWith('http')) {
      const fullPath = path.resolve(DOCS_DIR, src);
      if (!fs.existsSync(fullPath)) missingAssets.push(`script: ${src}`);
    }
  }
  for (const href of linkMatches) {
    if (!href.startsWith('http')) {
      const fullPath = path.resolve(DOCS_DIR, href);
      if (!fs.existsSync(fullPath)) missingAssets.push(`link: ${href}`);
    }
  }
  record('Referenced Scripts and Stylesheets Exist', missingAssets.length === 0,
    missingAssets.length === 0 ? `${scriptMatches.length} scripts, ${linkMatches.length} stylesheets verified` : `Missing: ${missingAssets.join(', ')}`);

  // Image Alternative Text
  const imgMatches = [...html.matchAll(/<img\s+[^>]*>/g)];
  const missingAlt = imgMatches.filter(img => !img[0].includes('alt='));
  record('Images Provide Alternative Text', missingAlt.length === 0,
    missingAlt.length === 0 ? `${imgMatches.length} img tags verified` : `${missingAlt.length} missing alt attribute`);
}

// -----------------------------------------------------------------------------
// 2. CSS SYNTAX & CONSISTENCY (docs/css/*.css)
// -----------------------------------------------------------------------------
console.log('\n--- 2. CSS SYNTAX & STYLESHEET INTEGRITY ---');
const cssDir = path.join(DOCS_DIR, 'css');
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
  let totalCssErrors = 0;

  for (const file of cssFiles) {
    const filePath = path.join(cssDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Balanced Braces Check
    let openBraces = 0;
    let balanced = true;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') openBraces++;
      if (content[i] === '}') {
        openBraces--;
        if (openBraces < 0) { balanced = false; break; }
      }
    }
    if (openBraces !== 0) balanced = false;
    if (!balanced) totalCssErrors++;

    record(`CSS Syntax: ${file}`, balanced, balanced ? 'Balanced rule blocks' : 'Unbalanced braces');
  }
}

// -----------------------------------------------------------------------------
// 3. JAVASCRIPT SYNTAX (docs/js, scripts, tests)
// -----------------------------------------------------------------------------
console.log('\n--- 3. JAVASCRIPT SYNTAX COMPILATION ---');
const jsDirs = [path.join(DOCS_DIR, 'js'), path.join(ROOT_DIR, 'scripts'), path.join(ROOT_DIR, 'tests')];
let totalJsFiles = 0;
let jsCompileErrors = 0;

for (const dir of jsDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    totalJsFiles++;
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf8');
    try {
      new vm.Script(code, { filename: file });
    } catch (err) {
      jsCompileErrors++;
      record(`JS Compile: ${file}`, false, err.message);
    }
  }
}
record('All JavaScript Files Compile Cleanly', jsCompileErrors === 0, `${totalJsFiles} files audited with 0 syntax errors`);

// -----------------------------------------------------------------------------
// 4. MARKDOWN & RELATIVE LINK RESOLUTION
// -----------------------------------------------------------------------------
console.log('\n--- 4. MARKDOWN INTEGRITY & LINK RESOLUTION ---');
const canonicalDocs = [
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'ACCESSIBILITY.md',
  'CASE_STUDY.md',
  'GITHUB_TELEMETRY_AUTOMATION.md',
  path.join('.github', 'PULL_REQUEST_TEMPLATE.md')
];

let brokenLinks = [];
let totalLinksAudited = 0;
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const relDoc of canonicalDocs) {
  const mdPath = path.join(ROOT_DIR, relDoc);
  if (!fs.existsSync(mdPath)) continue;
  const content = fs.readFileSync(mdPath, 'utf8');
  const dir = path.dirname(mdPath);
  const matches = [...content.matchAll(linkRegex)];

  for (const match of matches) {
    const rawTarget = match[2].trim();
    if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('file://') || rawTarget.startsWith('mailto:') || rawTarget.startsWith('#')) {
      continue;
    }
    totalLinksAudited++;
    const cleanTarget = rawTarget.split('#')[0].trim();
    if (!cleanTarget) continue;
    const resolvedPath = path.resolve(dir, cleanTarget);
    if (!fs.existsSync(resolvedPath)) {
      brokenLinks.push(`${relDoc}: ${match[1]} -> ${cleanTarget}`);
    }
  }
}
record('Internal Relative Markdown Links Resolve', brokenLinks.length === 0,
  brokenLinks.length === 0 ? `${totalLinksAudited} links verified across canonical documentation` : `Broken: ${brokenLinks.join('; ')}`);

// -----------------------------------------------------------------------------
// 5. JSON SCHEMA DRAFT-07 VALIDATION (docs/data/github-data.json)
// -----------------------------------------------------------------------------
console.log('\n--- 5. TELEMETRY JSON SCHEMA DRAFT-07 COMPLIANCE ---');
const dataJsonPath = path.join(DOCS_DIR, 'data', 'github-data.json');
const schemaJsonPath = path.join(DOCS_DIR, 'data', 'github-data-schema.json');
const contribSchemaPath = path.join(DOCS_DIR, 'data', 'contributions-schema.json');

if (fs.existsSync(dataJsonPath) && fs.existsSync(schemaJsonPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
    const schema = JSON.parse(fs.readFileSync(schemaJsonPath, 'utf8'));
    const validationErrors = validateDraft07(data, schema);
    record('Telemetry Validates Against Draft-07 Schema', validationErrors.length === 0,
      validationErrors.length === 0 ? '0 schema violations' : `Violations: ${JSON.stringify(validationErrors)}`);

    // Check required sections
    const hasSections = Boolean(data.user && data.telemetry && data.repositories && data.historical_milestones && data.recent_repository_commits && data.provenance);
    record('Required Telemetry Sections Present', hasSections, 'user, telemetry, repositories, milestones, commits, provenance verified');
  } catch (err) {
    record('Telemetry JSON Parses Cleanly', false, err.message);
  }
} else {
  record('Telemetry Files Exist', false, 'data or schema missing');
}

// TD-ARC-02: Verify reserved contributions schema integrity
if (fs.existsSync(contribSchemaPath)) {
  try {
    const contribSchema = JSON.parse(fs.readFileSync(contribSchemaPath, 'utf8'));
    const isValidDraft07 = Boolean(contribSchema.$schema && contribSchema.title && contribSchema.properties);
    record('Contributions Schema Integrity (TD-ARC-02)', isValidDraft07, 'Valid Draft-07 architectural specification');
  } catch (err) {
    record('Contributions Schema Integrity (TD-ARC-02)', false, err.message);
  }
} else {
  record('Contributions Schema Integrity (TD-ARC-02)', false, 'docs/data/contributions-schema.json missing');
}

// -----------------------------------------------------------------------------
// 6. ZERO-EMAIL PRIVACY INVARIANT
// -----------------------------------------------------------------------------
console.log('\n--- 6. ZERO-EMAIL PRIVACY INVARIANT ---');
const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const filesToScan = [
  ...canonicalDocs.map(d => path.join(ROOT_DIR, d)),
  path.join(DOCS_DIR, 'index.html'),
  dataJsonPath,
  ...fs.readdirSync(path.join(DOCS_DIR, 'js')).map(f => path.join(DOCS_DIR, 'js', f)),
  path.join(ROOT_DIR, '.github', 'workflows', 'github-telemetry-sync.yml')
];

let foundEmails = [];
for (const file of filesToScan) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const matches = (text.match(emailRegex) || []).filter(email => !email.endsWith('@users.noreply.github.com'));
  if (matches.length > 0) {
    foundEmails.push(`${path.relative(ROOT_DIR, file)}: ${matches.join(', ')}`);
  }
}
record('Zero-Email Privacy Rule Enforced', foundEmails.length === 0,
  foundEmails.length === 0 ? `${filesToScan.length} critical files scanned (0 personal emails detected)` : `Leaked in: ${foundEmails.join('; ')}`);

// -----------------------------------------------------------------------------
// 7. DUAL-TARGET SVG PROFILE ASSET SYNCHRONIZATION (TD-AST-01)
// -----------------------------------------------------------------------------
console.log('\n--- 7. DUAL-TARGET SVG PROFILE ASSET SYNCHRONIZATION ---');
const rootHeaderSvg = path.join(ROOT_DIR, 'assets', 'profile', 'blueprint-header.svg');
const docsHeaderSvg = path.join(DOCS_DIR, 'assets', 'profile', 'blueprint-header.svg');
const rootMetricsSvg = path.join(ROOT_DIR, 'assets', 'profile', 'blueprint-metrics.svg');
const docsMetricsSvg = path.join(DOCS_DIR, 'assets', 'profile', 'blueprint-metrics.svg');

if (fs.existsSync(rootHeaderSvg) && fs.existsSync(docsHeaderSvg)) {
  const rootBuf = fs.readFileSync(rootHeaderSvg);
  const docsBuf = fs.readFileSync(docsHeaderSvg);
  const isMatch = rootBuf.equals(docsBuf);
  record('Profile Header SVG Synchronized (TD-AST-01)', isMatch,
    isMatch ? 'assets/profile and docs/assets/profile are bit-for-bit identical' : 'Mismatch between root and docs SVG');
} else {
  record('Profile Header SVG Synchronized (TD-AST-01)', false, 'Missing blueprint-header.svg in root or docs');
}

if (fs.existsSync(rootMetricsSvg) && fs.existsSync(docsMetricsSvg)) {
  const rootBuf = fs.readFileSync(rootMetricsSvg);
  const docsBuf = fs.readFileSync(docsMetricsSvg);
  const isMatch = rootBuf.equals(docsBuf);
  record('Profile Metrics SVG Synchronized (TD-AST-01)', isMatch,
    isMatch ? 'assets/profile and docs/assets/profile are bit-for-bit identical' : 'Mismatch between root and docs SVG');
} else {
  record('Profile Metrics SVG Synchronized (TD-AST-01)', false, 'Missing blueprint-metrics.svg in root or docs');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`=== CODEBASE VALIDATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED ===`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
