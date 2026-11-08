#!/usr/bin/env node
/**
 * BLUEPRINT Automated Security & Privacy Audit Harness
 *
 * Audits:
 * 1. Secret Scanning (Zero tokens, private keys, or API credentials)
 * 2. Workflow Permissions & Least Privilege Verification
 * 3. Zero-Email Privacy Invariant
 * 4. Unauthenticated Public REST Mode Compliance
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const WORKFLOWS_DIR = path.join(ROOT_DIR, '.github', 'workflows');

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
console.log('=== BLUEPRINT AUTOMATED SECURITY & PRIVACY AUDIT HARNESS ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. SECRET SCANNING
// -----------------------------------------------------------------------------
console.log('--- 1. SECRET SCANNING & CREDENTIAL HYGIENE ---');

const secretPatterns = [
  { name: 'GitHub Personal Access Token (classic)', regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'GitHub Fine-grained PAT', regex: /github_pat_[a-zA-Z0-9_]{82}/ },
  { name: 'GitHub OAuth Token', regex: /gho_[a-zA-Z0-9]{36}/ },
  { name: 'Private Key Header', regex: /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH|PRIVATE)\s+KEY-----/ },
  { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'Generic API Secret Assignment', regex: /(?:api_key|apiKey|secret_key|secretKey|private_token)\s*=\s*['"][a-zA-Z0-9_-]{20,}['"]/i }
];

function scanDirForSecrets(dir, scanned = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForSecrets(fullPath, scanned);
    } else if (entry.isFile()) {
      scanned.push(fullPath);
    }
  }
  return scanned;
}

const allFiles = scanDirForSecrets(ROOT_DIR);
let exposedSecrets = [];

for (const file of allFiles) {
  // Only inspect text/source files
  const ext = path.extname(file).toLowerCase();
  if (!['.js', '.html', '.css', '.json', '.yml', '.yaml', '.md', '.sh'].includes(ext)) continue;

  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.regex.test(content)) {
      exposedSecrets.push(`${path.relative(ROOT_DIR, file)} matched ${pattern.name}`);
    }
  }
}

record('Zero Embedded Secrets or Credentials in Codebase', exposedSecrets.length === 0,
  exposedSecrets.length === 0 ? `${allFiles.length} repository files audited with 0 credential leaks` : `Found: ${exposedSecrets.join('; ')}`);

// -----------------------------------------------------------------------------
// 2. GITHUB ACTIONS WORKFLOW PERMISSION REVIEW
// -----------------------------------------------------------------------------
console.log('\n--- 2. WORKFLOW PERMISSIONS & LEAST PRIVILEGE ---');

if (fs.existsSync(WORKFLOWS_DIR)) {
  const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  let permissionViolations = [];

  for (const wf of workflowFiles) {
    const content = fs.readFileSync(path.join(WORKFLOWS_DIR, wf), 'utf8');

    // Must have explicit permissions block
    if (!content.includes('permissions:')) {
      permissionViolations.push(`${wf} lacks explicit permissions block`);
      continue;
    }

    // Must NOT have write-all
    if (/permissions:\s*write-all/i.test(content)) {
      permissionViolations.push(`${wf} declares excessive write-all permission`);
    }

    // CI workflow should only require contents: read
    if (wf === 'ci.yml') {
      if (!/permissions:\s*[\r\n\s]+contents:\s*read/i.test(content) && !/permissions:\s*read-all/i.test(content)) {
        permissionViolations.push(`ci.yml should be strictly read-only (contents: read)`);
      }
    }
  }

  record('All Workflows Enforce Explicit Minimal Permissions', permissionViolations.length === 0,
    permissionViolations.length === 0 ? `${workflowFiles.length} workflow definitions verified` : `Violations: ${permissionViolations.join('; ')}`);
}

// -----------------------------------------------------------------------------
// 3. ZERO-EMAIL PRIVACY INVARIANT
// -----------------------------------------------------------------------------
console.log('\n--- 3. ZERO-EMAIL PRIVACY INVARIANT ---');

const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const canonicalPaths = [
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'ACCESSIBILITY.md',
  'CASE_STUDY.md',
  'GITHUB_TELEMETRY_AUTOMATION.md',
  'docs/index.html',
  'docs/data/github-data.json',
  '.github/PULL_REQUEST_TEMPLATE.md'
];

let leakedEmails = [];
for (const rel of canonicalPaths) {
  const full = path.join(ROOT_DIR, rel);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf8');
  const emails = (content.match(emailRegex) || []).filter(e => !e.endsWith('@users.noreply.github.com'));
  if (emails.length > 0) {
    leakedEmails.push(`${rel}: ${emails.join(', ')}`);
  }
}

record('Zero Personal Emails in Public Assets & Documentation', leakedEmails.length === 0,
  leakedEmails.length === 0 ? `${canonicalPaths.length} production surfaces verified with 0 personal emails` : `Leaked in: ${leakedEmails.join('; ')}`);

// -----------------------------------------------------------------------------
// 4. UNAUTHENTICATED PUBLIC REST COMPLIANCE
// -----------------------------------------------------------------------------
console.log('\n--- 4. DATA PROVENANCE & REST INVARIANTS ---');

const dataPath = path.join(ROOT_DIR, 'docs', 'data', 'github-data.json');
if (fs.existsSync(dataPath)) {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const isUnauth = data.provenance && data.provenance.access_mode === 'UNAUTHENTICATED_PUBLIC_REST';
  const hasRateLimit = Boolean(data.provenance && data.provenance.rate_limit_snapshot && data.provenance.rate_limit_snapshot.limit === 60);

  record('Telemetry Preserves Unauthenticated Public REST Mode', isUnauth && hasRateLimit,
    `Mode: ${data.provenance?.access_mode}, Rate Limit Limit: ${data.provenance?.rate_limit_snapshot?.limit}`);
}

// -----------------------------------------------------------------------------
// 5. DOM XSS & DYNAMIC INJECTION RESILIENCE (TD-SEC-01)
// -----------------------------------------------------------------------------
console.log('\n--- 5. DOM XSS & DYNAMIC INJECTION RESILIENCE (TD-SEC-01) ---');

const interactivityPath = path.join(ROOT_DIR, 'docs', 'js', 'interactivity.js');
if (fs.existsSync(interactivityPath)) {
  const interactivityCode = fs.readFileSync(interactivityPath, 'utf8');

  // Verify safe DOM row construction functions exist and direct template innerHTML interpolation is eliminated
  const hasSafeConstructors = interactivityCode.includes('function createMilestoneRow') &&
    interactivityCode.includes('function createCommitRow');
  const noVulnerableCommitInterpolation = !interactivityCode.includes('tbody.innerHTML = commits.map') &&
    !interactivityCode.includes('${c.message}');

  record('Logbook Table Safe DOM Construction (TD-SEC-01)', hasSafeConstructors && noVulnerableCommitInterpolation,
    'createMilestoneRow and createCommitRow use document.createElement and textContent instead of innerHTML interpolation');

  // Verify security utilities are exposed and functioning properly
  const mockContext = {
    window: {},
    document: {
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    }
  };
  vm.createContext(mockContext);
  let vmPassed = false;
  let escapeHtmlWorks = false;
  let sanitizeUrlWorks = false;

  try {
    vm.runInContext(interactivityCode, mockContext);
    if (mockContext.window && mockContext.window.BlueprintSecurity) {
      const { escapeHtml, sanitizeUrl } = mockContext.window.BlueprintSecurity;

      // Test escapeHtml
      const testPayload = '<script>alert("xss")</script>&\'';
      const escaped = escapeHtml(testPayload);
      escapeHtmlWorks = !escaped.includes('<') &&
        !escaped.includes('>') &&
        escaped.includes('&lt;script&gt;') &&
        escaped.includes('&quot;') &&
        escaped.includes('&#39;') &&
        escaped.includes('&amp;');

      // Test sanitizeUrl
      const dangerousUrls = [
        'javascript:alert(1)',
        'javAsCript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)'
      ];
      const validUrls = [
        'https://github.com/sahasanchayan44-tech/sahasanchayan44-tech',
        'http://localhost:8088/index.html'
      ];

      const allDangerousBlocked = dangerousUrls.every(u => sanitizeUrl(u) === '#');
      const allValidAllowed = validUrls.every(u => sanitizeUrl(u) === u);
      sanitizeUrlWorks = allDangerousBlocked && allValidAllowed;

      vmPassed = true;
    }
  } catch (err) {
    console.error('VM execution failed:', err.message);
  }

  record('Security Helpers Module Window Export', vmPassed,
    'window.BlueprintSecurity successfully registered in execution context');
  record('HTML Escaping Neutralizes Script & Markup Payloads', escapeHtmlWorks,
    'escapeHtml transforms angle brackets, quotes, and ampersands into HTML entities');
  record('URL Sanitizer Neutralizes Pseudo-Protocols (javascript:, data:)', sanitizeUrlWorks,
    'sanitizeUrl rejects non-http(s) URI schemes with safe anchor fallback');
} else {
  record('interactivity.js Presence', false, 'docs/js/interactivity.js not found');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`=== SECURITY AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED ===`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
