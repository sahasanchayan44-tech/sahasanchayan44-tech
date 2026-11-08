#!/usr/bin/env node
/**
 * BLUEPRINT - Phase 5.2 README Content Integrity & Claim Calibration Audit
 * 
 * Verifies:
 * - All 67 foundational Phase 5.1 structural and schema assertions.
 * - Negative assertions ensuring removal of unsupported claims (92% backtest accuracy, production-grade exaggeration, 100% open-source without license proof).
 * - Calibration assertions ensuring accurate snapshot telemetry wording.
 * - Host repository matching for Sheet 07 research labs (LAB-01 to LAB-04).
 * - Explicit unverified license disclosure for public repositories.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const readmePath = path.join(rootDir, 'README.md');
const headerSvgPath = path.join(rootDir, 'assets/profile/blueprint-header.svg');
const metricsSvgPath = path.join(rootDir, 'assets/profile/blueprint-metrics.svg');
const snapshotPath = path.join(rootDir, 'docs/data/github-data.json');

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

let passes = 0;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passes++;
  } else {
    console.error(`[FAIL] ${message}`);
    failures++;
  }
}

async function runAudit() {
  console.log('===========================================================');
  console.log('BLUEPRINT PHASE 5.2: CLAIM INTEGRITY & CALIBRATION AUDIT');
  console.log('===========================================================\n');

  // 1. File existence (4 assertions)
  assert(fs.existsSync(readmePath), 'README.md exists at project root');
  assert(fs.existsSync(headerSvgPath), 'blueprint-header.svg exists in assets/profile/');
  assert(fs.existsSync(metricsSvgPath), 'blueprint-metrics.svg exists in assets/profile/');
  assert(fs.existsSync(snapshotPath), 'github-data.json exists in docs/data/');

  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const headerSvgContent = fs.readFileSync(headerSvgPath, 'utf8');
  const metricsSvgContent = fs.readFileSync(metricsSvgPath, 'utf8');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  // 2. Strict Zero Email Exposure (3 assertions)
  const readmeEmails = readmeContent.match(emailRegex) || [];
  const headerEmails = headerSvgContent.match(emailRegex) || [];
  const metricsEmails = metricsSvgContent.match(emailRegex) || [];

  assert(readmeEmails.length === 0, `README.md contains zero emails (found ${readmeEmails.length})`);
  assert(headerEmails.length === 0, `Header SVG contains zero emails (found ${headerEmails.length})`);
  assert(metricsEmails.length === 0, `Metrics SVG contains zero emails (found ${metricsEmails.length})`);

  // 3. Identity Parameters (4 assertions)
  assert(readmeContent.includes('SANCHAYAN SAHA'), 'README contains developer name in uppercase');
  assert(readmeContent.includes('sahasanchayan44-tech'), 'README contains GitHub login handle');
  assert(readmeContent.includes('SAHA-BP-2026-01'), 'README contains document ID SAHA-BP-2026-01');
  assert(readmeContent.includes('268472249'), 'README contains user ID 268472249');

  // 4. Asset Links in README (2 assertions)
  assert(readmeContent.includes('./assets/profile/blueprint-header.svg'), 'README links to blueprint-header.svg via relative path');
  assert(readmeContent.includes('./assets/profile/blueprint-metrics.svg'), 'README links to blueprint-metrics.svg via relative path');

  // 5. Repository Registry Fidelity (28 assertions)
  const repos = Array.isArray(snapshot.repositories) ? snapshot.repositories : snapshot.repositories.items;
  assert(repos.length === 9, `Snapshot contains exactly 9 repositories (found ${repos.length})`);

  for (const repo of repos) {
    const hasName = readmeContent.includes(`[\`${repo.name}\`]`) || readmeContent.includes(`\`${repo.name}\``);
    const hasUrl = readmeContent.includes(repo.repo_url);
    const hasLang = readmeContent.includes(repo.primary_language);

    assert(hasName, `README contains repository name: ${repo.name}`);
    assert(hasUrl, `README contains exact URL: ${repo.repo_url}`);
    assert(hasLang, `README lists primary language ${repo.primary_language} for ${repo.name}`);
  }

  // 6. Metrics Integrity (6 assertions)
  assert(readmeContent.includes('09 Public Codebases') || readmeContent.includes('09 Public Engineering Repositories') || readmeContent.includes('9 Public'), 'README correctly cites 9 public repositories');
  assert(readmeContent.includes('02 Stars') || readmeContent.includes('2 Stars'), 'README correctly cites 2 public stars');
  assert(readmeContent.includes('02 Forks') || readmeContent.includes('2 Forks'), 'README correctly cites 2 public forks');
  assert(readmeContent.includes('22 API Query Transactions'), 'README records 22 snapshot event query transactions');
  assert(readmeContent.includes('38 Commits'), 'README records 38 recent commits');
  assert(readmeContent.includes('11 Architectural Milestones'), 'README records 11 historical milestones');

  // 7. Research Laboratory & Learning Roadmap (3 assertions)
  assert(readmeContent.includes('LAB-01') && readmeContent.includes('LAB-02') && readmeContent.includes('LAB-03') && readmeContent.includes('LAB-04'), 'README documents Sheet 07 research labs (LAB-01 to LAB-04)');
  assert(readmeContent.includes('Phase 01: Distributed Systems Core'), 'README documents Sheet 09 Phase 01 roadmap');
  assert(readmeContent.includes('Phase 02: Edge AI & High-Throughput Inference'), 'README documents Sheet 09 Phase 02 roadmap');

  // 8. 12-Sheet Master Navigation Index (12 assertions)
  for (let s = 1; s <= 12; s++) {
    const sheetNum = String(s).padStart(2, '0');
    assert(readmeContent.includes(`**${sheetNum}**`), `README master index references Sheet ${sheetNum}`);
  }

  // 9. Heading Hierarchy & Structure (2 assertions)
  const headings = readmeContent.split('\n').filter(line => line.startsWith('#'));
  const h1Count = headings.filter(h => h.startsWith('# ')).length;
  assert(h1Count === 1, `README has exactly one top-level H1 heading (found ${h1Count})`);
  assert(headings.length >= 8, `README contains complete structured section headings (found ${headings.length})`);

  // 10. Local Preview Notice (1 assertion)
  assert(readmeContent.includes('http://localhost:8088/index.html'), 'README includes local preview URL reference');

  // 11. SVG XML Validation (2 assertions)
  try {
    const checkHeader = execSync(`python3 -c "import xml.etree.ElementTree as ET; tree = ET.parse('${headerSvgPath}'); root = tree.getroot(); print(root.attrib.get('viewBox'))"`, { encoding: 'utf8' }).trim();
    assert(checkHeader === '0 0 960 280', `blueprint-header.svg parsed cleanly with viewBox ${checkHeader}`);
  } catch (err) {
    assert(false, `blueprint-header.svg XML error: ${err.message}`);
  }

  try {
    const checkMetrics = execSync(`python3 -c "import xml.etree.ElementTree as ET; tree = ET.parse('${metricsSvgPath}'); root = tree.getroot(); print(root.attrib.get('viewBox'))"`, { encoding: 'utf8' }).trim();
    assert(checkMetrics === '0 0 960 140', `blueprint-metrics.svg parsed cleanly with viewBox ${checkMetrics}`);
  } catch (err) {
    assert(false, `blueprint-metrics.svg XML error: ${err.message}`);
  }

  // =========================================================
  // PHASE 5.2 CALIBRATION & INTEGRITY ADDITIONS (10 assertions)
  // =========================================================
  console.log('\n--- PHASE 5.2 CLAIM INTEGRITY CHECKS ---');

  // Negative assertion: 92% backtest accuracy claim must NOT be present
  assert(!readmeContent.includes('92%'), 'Unsupported "92%" accuracy claim removed from README');

  // Negative assertion: "Production-Grade Engineering" wording must NOT be present
  assert(!readmeContent.includes('Production-Grade Engineering'), 'Unsubstantiated "Production-Grade Engineering" phrase removed');

  // Negative assertion: "100% open-source" must NOT be present without verified licenses
  assert(!readmeContent.includes('100% of the 9 public repositories above are strictly open-source'), 'Unsubstantiated "100% strictly open-source" claim removed');

  // Positive assertion: Explicit unverified license status disclosure
  assert(readmeContent.includes('License Status') && readmeContent.includes('Unverified / Unspecified'), 'Repository registry explicitly discloses unverified license status');

  // Positive assertion: Sheet 07 research labs mapped to true host repositories
  assert(readmeContent.includes('chandrayaan-4.0') && readmeContent.includes('SPACE TELEMETRY'), 'LAB-01 accurately mapped to Space Telemetry (chandrayaan-4.0)');
  assert(readmeContent.includes('neuroverse') && readmeContent.includes('3D COGNITIVE SYSTEMS'), 'LAB-02 accurately mapped to 3D Cognitive Systems (neuroverse)');
  assert(readmeContent.includes('exam-oracle-ai') && readmeContent.includes('STATISTICAL ML'), 'LAB-03 accurately mapped to Statistical ML (exam-oracle-ai)');
  assert(readmeContent.includes('aria') && readmeContent.includes('LOCAL AI AUTOMATION'), 'LAB-04 accurately mapped to Local AI Automation (aria)');

  // Positive assertion: Accurate snapshot telemetry wording
  assert(readmeContent.includes('Snapshot schema audits') || readmeContent.includes('snapshot telemetry'), 'Telemetry pipeline accurately framed as snapshot-based');

  // Negative assertion: No claims of continuously live telemetry
  assert(!readmeContent.includes('Real-time telemetry audits'), 'Replaced "Real-time telemetry audits" with snapshot audit phrasing');

  console.log('\n===========================================================');
  console.log(`AUDIT COMPLETE: ${passes} PASSES, ${failures} FAILURES`);
  console.log('===========================================================\n');

  if (failures > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
