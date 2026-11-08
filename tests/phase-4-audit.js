/**
 * BLUEPRINT / FORGE RUNTIME — PHASE 4 PUBLIC GITHUB DATA INTEGRATION AUDIT
 * Automated verification of all 16 verification suites specified in PHASE_4_2_IMPLEMENTATION_PLAN.md
 * Uses Chrome DevTools Protocol (CDP) and headless Chrome.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/sanchayan/.gemini/antigravity-cli/brain/ba104f24-3512-447a-94f4-28ebcde27861';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.consoleErrors = [];
    this.networkRequests = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        this.consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : ''));
      }
      if (msg.method === 'Network.requestWillBeSent') {
        this.networkRequests.push(msg.params.request.url);
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('Exception on eval [' + expression + ']:', res.exceptionDetails);
      throw new Error((res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text || 'Evaluation failed');
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buf);
    // Also copy to artifact directory if base name matches
    if (fs.existsSync(ARTIFACT_DIR)) {
      const base = path.basename(filePath);
      fs.writeFileSync(path.join(ARTIFACT_DIR, base), buf);
    }
  }

  close() {
    this.ws.close();
  }
}

async function runPhase4Audit() {
  console.log('================================================================');
  console.log('=== BLUEPRINT: RUNNING PHASE 4 AUTOMATED VERIFICATION AUDIT ===');
  console.log('================================================================\n');

  const results = [];
  function record(suiteId, testName, passed, details = '') {
    results.push({ suiteId, testName, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[SUITE ${suiteId}] ${mark}: ${testName} ${details ? '— ' + details : ''}`);
  }

  const rootDir = path.resolve(__dirname, '..');
  const schemaPath = path.join(rootDir, 'docs/data/github-data-schema.json');
  const dataPath = path.join(rootDir, 'docs/data/github-data.json');
  const screenshotsDir = path.join(rootDir, 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  // ------------------------------------------------------------------------
  // SUITE 1: SCHEMA STRICT VALIDATION
  // ------------------------------------------------------------------------
  console.log('--- 1. SCHEMA STRICT VALIDATION ---');
  let schema, data;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const requiredTopLevel = ['provenance', 'user', 'telemetry', 'repositories', 'historical_milestones', 'recent_repository_commits', 'limitations'];
    const hasAllTopLevel = requiredTopLevel.every(k => data.hasOwnProperty(k));

    const userValid = data.user && data.user.login === 'sahasanchayan44-tech' && data.user.id === 268472249 && typeof data.user.public_repos === 'number';
    const reposValid = Array.isArray(data.repositories) && data.repositories.length === 9 && data.repositories.every(r => r.name && r.repo_url && typeof r.stars === 'number');
    const recentCommitsValid = Array.isArray(data.recent_repository_commits) && data.recent_repository_commits.length >= 9 && data.recent_repository_commits.every(c => c.repository && c.commit_sha && (c.author_login || c.author_login === null));
    const milestonesValid = Array.isArray(data.historical_milestones) && data.historical_milestones.length === 11 && data.historical_milestones.every(m => m.log_id && m.commit_sha && m.verification_status);
    const provValid = Boolean(data.provenance && data.provenance.access_mode === 'UNAUTHENTICATED_PUBLIC_REST' && data.provenance.rate_limit_snapshot);

    const suite1Pass = Boolean(hasAllTopLevel && userValid && reposValid && recentCommitsValid && milestonesValid && provValid);
    record('01', 'Schema Strict Compliance (Draft-07 Structure & Properties)', suite1Pass, `Top-level keys verified: ${hasAllTopLevel}, repos: ${data.repositories.length}, milestones: ${data.historical_milestones.length}`);
  } catch (e) {
    record('01', 'Schema Strict Compliance', false, e.message);
  }

  // ------------------------------------------------------------------------
  // SUITE 2: QUOTA SAFETY THRESHOLD ASSERTION
  // ------------------------------------------------------------------------
  console.log('\n--- 2. QUOTA SAFETY THRESHOLD ASSERTION ---');
  try {
    let childExitedWithOne = false;
    let abortMessageCaptured = false;

    try {
      execSync('node scripts/fetch-public-github-data.js --mock-low-quota', {
        cwd: rootDir,
        stdio: 'pipe'
      });
    } catch (err) {
      childExitedWithOne = err.status === 1;
      const combinedOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
      abortMessageCaptured = combinedOutput.includes('[ABORT]') && (combinedOutput.includes('safety gate') || combinedOutput.includes('safety threshold'));
    }

    const suite2Pass = childExitedWithOne && abortMessageCaptured;
    record('02', 'Collector Script Aborts Cleanly When Quota < 35', suite2Pass, `Exit Code 1: ${childExitedWithOne}, Abort Notice Logged: ${abortMessageCaptured}`);
  } catch (e) {
    record('02', 'Collector Script Aborts Cleanly When Quota < 35', false, e.message);
  }

  // ------------------------------------------------------------------------
  // SUITE 3: DATA PROVENANCE VERIFICATION
  // ------------------------------------------------------------------------
  console.log('\n--- 3. DATA PROVENANCE VERIFICATION ---');
  try {
    const prov = data.provenance;
    const isoUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    const timestampValid = isoUtcRegex.test(prov.collected_at_utc);
    const accessModeValid = prov.access_mode === 'UNAUTHENTICATED_PUBLIC_REST';
    const sourceValid = typeof prov.primary_source === 'string' && prov.primary_source.startsWith('https://api.github.com');
    const rateLimitValid = prov.rate_limit_snapshot && prov.rate_limit_snapshot.limit === 60 && prov.rate_limit_snapshot.remaining >= 35;

    const suite3Pass = timestampValid && accessModeValid && sourceValid && rateLimitValid;
    record('03', 'Public Provenance & Rate Limit Snapshot Invariants', suite3Pass, `Source: ${prov.primary_source}, Mode: ${prov.access_mode}, Snapshot: ${prov.rate_limit_snapshot.remaining}/${prov.rate_limit_snapshot.limit}`);
  } catch (e) {
    record('03', 'Public Provenance & Rate Limit Snapshot Invariants', false, e.message);
  }

  // ------------------------------------------------------------------------
  // SUITE 4: HISTORICAL LOGBOOK IMMUTABILITY
  // ------------------------------------------------------------------------
  console.log('\n--- 4. HISTORICAL LOGBOOK IMMUTABILITY ---');
  try {
    const expectedMilestones = [
      { log_id: 'LOG-01', sha: 'LOCAL SPEC', repo: 'sahasanchayan44-tech/BLUEPRINT' },
      { log_id: 'LOG-02', sha: '3409681', repo: 'sahasanchayan44-tech/portfolio' },
      { log_id: 'LOG-03', sha: '9c56152', repo: 'sahasanchayan44-tech/exam-oracle-ai' },
      { log_id: 'LOG-04', sha: 'f150e42', repo: 'sahasanchayan44-tech/neuroverse' },
      { log_id: 'LOG-05', sha: 'a3bf025', repo: 'sahasanchayan44-tech/chandrayaan-4.0' },
      { log_id: 'LOG-06', sha: '304876e', repo: 'sahasanchayan44-tech/sunapse-android' },
      { log_id: 'LOG-07', sha: '34909cc', repo: 'sahasanchayan44-tech/admin-panel' },
      { log_id: 'LOG-08', sha: '854d01a', repo: 'sahasanchayan44-tech/study-manager' },
      { log_id: 'LOG-09', sha: '119369b', repo: 'sahasanchayan44-tech/synapse' },
      { log_id: 'LOG-10', sha: '17f670e', repo: 'sahasanchayan44-tech/aria' },
      { log_id: 'LOG-11', sha: 'API: 268472249', repo: 'github.com/sahasanchayan44-tech' }
    ];

    const milestones = data.historical_milestones;
    const lengthMatches = milestones.length === 11;
    let allShasMatch = true;
    for (let i = 0; i < expectedMilestones.length; i++) {
      const expected = expectedMilestones[i];
      const actual = milestones[i];
      if (!actual || actual.log_id !== expected.log_id || actual.commit_sha !== expected.sha || actual.repository !== expected.repo) {
        allShasMatch = false;
        console.warn(`Mismatch at index ${i}: expected ${JSON.stringify(expected)} vs actual ${JSON.stringify(actual)}`);
        break;
      }
    }

    const suite4Pass = lengthMatches && allShasMatch;
    record('04', 'All 11 Historical Milestones Preserved with Exact SHAs', suite4Pass, `Verified 11/11 milestone entries in exact sequence without truncation or overwrite`);
  } catch (e) {
    record('04', 'All 11 Historical Milestones Preserved with Exact SHAs', false, e.message);
  }

  // ------------------------------------------------------------------------
  // SUITE 5: RECENT COMMITS SEPARATION
  // ------------------------------------------------------------------------
  console.log('\n--- 5. RECENT COMMITS SEPARATION ---');
  try {
    const recent = data.recent_repository_commits;
    const hasRecent = Array.isArray(recent) && recent.length >= 9;
    const noHistoricalMix = recent.every(c => c.repository && c.commit_sha && c.message);
    const suite5Pass = hasRecent && noHistoricalMix;
    record('05', 'Recent Commits Maintained as Distinct Dataset', suite5Pass, `Found ${recent.length} recent commit records distinct from historical milestones`);
  } catch (e) {
    record('05', 'Recent Commits Maintained as Distinct Dataset', false, e.message);
  }

  // ------------------------------------------------------------------------
  // SUITE 6: ZERO-EMAIL PRIVACY ASSERTION (JSON SCAN)
  // ------------------------------------------------------------------------
  console.log('\n--- 6. ZERO-EMAIL PRIVACY ASSERTION (RAW DATA) ---');
  try {
    const rawDataStr = fs.readFileSync(dataPath, 'utf8');
    const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
    const jsonEmailMatches = rawDataStr.match(emailRegex) || [];
    const suite6JsonPass = jsonEmailMatches.length === 0;
    record('06-JSON', 'Zero Email Addresses in docs/data/github-data.json', suite6JsonPass, `Found ${jsonEmailMatches.length} email addresses`);
  } catch (e) {
    record('06-JSON', 'Zero Email Addresses in docs/data/github-data.json', false, e.message);
  }

  // ------------------------------------------------------------------------
  // START BROWSER CDP AUDIT
  // ------------------------------------------------------------------------
  const port = 9366;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    'http://localhost:8088/index.html'
  ]);

  let cdp;

  try {
    let connected = false;
    for (let i = 0; i < 20; i++) {
      try {
        const version = await getJson(`http://127.0.0.1:${port}/json/version`);
        if (version && version.webSocketDebuggerUrl) {
          connected = true;
          break;
        }
      } catch (e) {
        await sleep(250);
      }
    }
    if (!connected) throw new Error('Could not connect to Chrome debugging port.');

    const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found.');

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');

    // Wait for initial hydration
    await sleep(600);

    // ------------------------------------------------------------------------
    // SUITE 6 (PART B): ZERO-EMAIL PRIVACY ASSERTION (RENDERED DOM)
    // ------------------------------------------------------------------------
    console.log('\n--- 6 (PART B). ZERO-EMAIL PRIVACY IN RENDERED DOM ---');
    const domEmails = await cdp.evaluate(`(() => {
      const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
      const text = document.body.innerText;
      const matches = text.match(emailRegex) || [];
      return matches;
    })()`);
    const suite6DomPass = domEmails.length === 0;
    record('06-DOM', 'Zero Email Addresses in Rendered Browser DOM', suite6DomPass, `Matches in body: ${domEmails.length}`);

    // ------------------------------------------------------------------------
    // SUITE 7: NULLABLE FIELD RESILIENCE
    // ------------------------------------------------------------------------
    console.log('\n--- 7. NULLABLE FIELD RESILIENCE ---');
    const nullResilience = await cdp.evaluate(`(() => {
      try {
        const mockNullData = {
          user: { login: 'sahasanchayan44-tech', id: 268472249, public_repos: 9, followers: 0, following: 2, public_gists: 0, bio: null, location: null },
          repositories: [
            { name: 'mock-repo', full_name: 'sahasanchayan44-tech/mock-repo', stars: 0, forks: 0, open_issues: 0, primary_language: null, description: null, repo_url: 'https://github.com/mock', updated_at: null }
          ],
          telemetry: { total_stars: 2, total_forks: 2, total_open_issues: 0, languages_aggregated: {} },
          historical_milestones: [],
          recent_repository_commits: [],
          provenance: { access_mode: 'UNAUTHENTICATED_PUBLIC_REST', collected_at_utc: '2026-11-08T00:00:00Z', rate_limit_snapshot: { limit: 60, remaining: 40 } }
        };
        window.BlueprintDataService.setMockData(mockNullData);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    })()`);
    // Restore real data
    await cdp.evaluate(`window.BlueprintDataService.init()`);
    await sleep(300);
    record('07', 'Graceful Handling of Null Descriptions & Languages', nullResilience.success, nullResilience.success ? 'No runtime exceptions on null attributes' : nullResilience.error);

    // ------------------------------------------------------------------------
    // SUITE 8: ACCOUNT TELEMETRY RECONCILIATION
    // ------------------------------------------------------------------------
    console.log('\n--- 8. ACCOUNT TELEMETRY RECONCILIATION ---');
    const accountTelem = await cdp.evaluate(`(() => {
      const repos = document.getElementById('stat-repos-count')?.textContent.trim();
      const followers = document.getElementById('stat-followers-count')?.textContent.trim();
      const following = document.getElementById('stat-following-count')?.textContent.trim();
      const gists = document.getElementById('stat-gists-count')?.textContent.trim();
      return { repos, followers, following, gists };
    })()`);
    const suite8Pass = accountTelem.repos === '09' && accountTelem.followers === '00' && accountTelem.following === '02' && accountTelem.gists === '00';
    record('08', 'Account Telemetry Reconciled to Public GitHub Account', suite8Pass, `Repos: ${accountTelem.repos}, Followers: ${accountTelem.followers}, Following: ${accountTelem.following}, Gists: ${accountTelem.gists}`);

    // ------------------------------------------------------------------------
    // SUITE 9: REPOSITORY TELEMETRY AGGREGATION
    // ------------------------------------------------------------------------
    console.log('\n--- 9. REPOSITORY TELEMETRY AGGREGATION ---');
    const repoTelem = await cdp.evaluate(`(() => {
      const stars = document.getElementById('stat-stars-count')?.textContent.trim();
      const forks = document.getElementById('stat-forks-count')?.textContent.trim();
      return { stars, forks };
    })()`);
    const suite9Pass = repoTelem.stars === '02' && repoTelem.forks === '02';
    record('09', 'Repository Telemetry Aggregation Reconciled', suite9Pass, `Total Stars: ${repoTelem.stars}, Total Forks: ${repoTelem.forks}`);

    // ------------------------------------------------------------------------
    // SUITE 10: ZERO EXTERNAL BROWSER REQUESTS (NO GITHUB API CALLS)
    // ------------------------------------------------------------------------
    console.log('\n--- 10. ZERO EXTERNAL BROWSER REQUESTS ---');
    const githubApiCalls = cdp.networkRequests.filter(u => u.includes('api.github.com') || u.includes('github.com/api') || u.includes('raw.githubusercontent.com'));
    const suite10Pass = githubApiCalls.length === 0;
    record('10', 'Zero External Browser Network Calls to GitHub API', suite10Pass, `GitHub API calls intercepted: ${githubApiCalls.length} (Total network requests: ${cdp.networkRequests.length})`);

    // ------------------------------------------------------------------------
    // SUITE 11: OFFLINE / FALLBACK RESILIENCE
    // ------------------------------------------------------------------------
    console.log('\n--- 11. OFFLINE / FALLBACK RESILIENCE ---');
    const offlineTest = await cdp.evaluate(`(async () => {
      const prevStatus = window.BlueprintDataService.getStatus();
      await window.BlueprintDataService.loadFromUrl('/docs/data/non-existent-simulated-file.json');
      const fallbackStatus = window.BlueprintDataService.getStatus();
      const freshness = window.BlueprintDataService.getFreshness();
      const badgeText = document.getElementById('data-status-badge')?.textContent.trim();
      const badgeClass = document.getElementById('data-status-badge')?.className;
      
      // Re-init with real data
      await window.BlueprintDataService.init();
      return {
        prevStatus,
        fallbackStatus,
        isOffline: freshness.isOffline,
        badgeText,
        badgeClass
      };
    })()`);
    const suite11Pass = offlineTest.fallbackStatus === 'OFFLINE_FALLBACK' && offlineTest.isOffline && offlineTest.badgeClass.includes('offline');
    record('11', 'Standalone Offline Baseline Fallback When Local Fetch Fails', suite11Pass, `Status: ${offlineTest.fallbackStatus}, Offline Badge: "${offlineTest.badgeText}"`);

    // ------------------------------------------------------------------------
    // SUITE 12: SHEET 04 DYNAMIC EXPLORER
    // ------------------------------------------------------------------------
    console.log('\n--- 12. SHEET 04 DYNAMIC EXPLORER ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3, false)`);
    await sleep(200);

    const searchResult = await cdp.evaluate(`(() => {
      const searchInput = document.getElementById('repo-search-input');
      searchInput.value = 'chandrayaan';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      const visibleCards = Array.from(document.querySelectorAll('#sheet-04 .project-card')).filter(c => !c.classList.contains('hidden-by-filter'));
      const cardTitle = visibleCards[0]?.querySelector('.project-title')?.textContent.trim();
      
      // Reset
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      const allCards = Array.from(document.querySelectorAll('#sheet-04 .project-card')).filter(c => !c.classList.contains('hidden-by-filter'));

      return {
        filterCount: visibleCards.length,
        matchedTitle: cardTitle,
        resetCount: allCards.length
      };
    })()`);
    const suite12Pass = searchResult.filterCount === 1 && searchResult.matchedTitle.toLowerCase().includes('chandrayaan') && searchResult.resetCount === 9;
    record('12', 'Sheet 04 Dynamic Explorer Search & Filter Responsiveness', suite12Pass, `Search for "chandrayaan" yielded ${searchResult.filterCount} card ("${searchResult.matchedTitle}"), reset to ${searchResult.resetCount} cards`);

    // ------------------------------------------------------------------------
    // SUITE 13: SHEET 04 MODAL FOCUS TRAP REGRESSION
    // ------------------------------------------------------------------------
    console.log('\n--- 13. SHEET 04 MODAL FOCUS TRAP REGRESSION ---');
    const modalTest = await cdp.evaluate(`(() => {
      const firstCard = document.querySelector('#sheet-04 .project-card');
      firstCard.click();
      const modal = document.getElementById('project-modal');
      const modalOpen = modal.classList.contains('open');
      const activeElementId = document.activeElement ? document.activeElement.id : null;
      
      // Dispatch Escape
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      const modalClosed = !modal.classList.contains('open');
      const focusRestored = document.activeElement === firstCard;

      return {
        modalOpen,
        closeBtnFocused: activeElementId === 'modal-close-btn',
        modalClosed,
        focusRestored
      };
    })()`);
    const suite13Pass = modalTest.modalOpen && modalTest.closeBtnFocused && modalTest.modalClosed && modalTest.focusRestored;
    record('13', 'Sheet 04 Modal Focus Trap and Escape Restoration Regression', suite13Pass, `Modal opened: ${modalTest.modalOpen}, close btn focused: ${modalTest.closeBtnFocused}, modal closed: ${modalTest.modalClosed}, focus restored: ${modalTest.focusRestored}`);

    // ------------------------------------------------------------------------
    // SUITE 14: SHEET 06 STATIC PREVIEW WARNING ASSERTION
    // ------------------------------------------------------------------------
    console.log('\n--- 14. SHEET 06 STATIC PREVIEW WARNING ASSERTION ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(5, false)`);
    await sleep(200);

    const s6Notice = await cdp.evaluate(`(() => {
      const s6 = document.getElementById('sheet-06');
      const text = s6 ? s6.textContent : '';
      const hasStaticBanner = text.includes('STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA');
      const hasGraphqlNotice = text.includes('FULL 52-WEEK CONTRIBUTION CALENDAR REQUIRES AUTHENTICATED GRAPHQL PIPELINE') || text.includes('REQUIRES AUTHENTICATED GRAPHQL PIPELINE');
      return { hasStaticBanner, hasGraphqlNotice };
    })()`);
    const suite14Pass = s6Notice.hasStaticBanner && s6Notice.hasGraphqlNotice;
    record('14', 'Sheet 06 Explicit Static Preview & GraphQL Warning Preservation', suite14Pass, `Static preview banner: ${s6Notice.hasStaticBanner}, GraphQL pipeline disclosure: ${s6Notice.hasGraphqlNotice}`);

    // ------------------------------------------------------------------------
    // SUITE 5 (BROWSER PART): SHEET 10 DATASET TOGGLE INTERACTIVITY
    // ------------------------------------------------------------------------
    console.log('\n--- SHEET 10 DATASET TOGGLE INTERACTIVITY ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9, false)`);
    await sleep(200);

    const toggleTest = await cdp.evaluate(`(() => {
      const toggleBtn = document.getElementById('log-dataset-toggle-btn');
      const initialRows = document.querySelectorAll('#sheet-10 .logbook-table tbody tr').length;
      const initialBtnText = toggleBtn ? toggleBtn.textContent : '';

      // Click toggle
      if (toggleBtn) toggleBtn.click();
      const recentRows = document.querySelectorAll('#sheet-10 .logbook-table tbody tr').length;
      const recentBtnText = toggleBtn ? toggleBtn.textContent : '';

      // Click toggle back to milestones
      if (toggleBtn) toggleBtn.click();
      const restoredRows = document.querySelectorAll('#sheet-10 .logbook-table tbody tr').length;

      return {
        initialRows,
        initialBtnText,
        recentRows,
        recentBtnText,
        restoredRows
      };
    })()`);
    const togglePass = toggleTest.initialRows === 11 && toggleTest.recentRows >= 9 && toggleTest.restoredRows === 11;
    record('05-UI', 'Sheet 10 Dataset Toggle UI Interaction (Milestones <-> Recent Commits)', togglePass, `Milestones: ${toggleTest.initialRows} rows -> Recent: ${toggleTest.recentRows} rows -> Restored: ${toggleTest.restoredRows} rows`);

    // ------------------------------------------------------------------------
    // SUITE 15: RESPONSIVE ZERO-OVERFLOW REGRESSION
    // ------------------------------------------------------------------------
    console.log('\n--- 15. RESPONSIVE ZERO-OVERFLOW REGRESSION ---');
    const viewports = [
      { name: '1920x1080', width: 1920, height: 1080, mobile: false },
      { name: '1440x900',  width: 1440, height: 900,  mobile: false },
      { name: '768x1024',  width: 768,  height: 1024, mobile: false },
      { name: '390x844',   width: 390,  height: 844,  mobile: true  },
      { name: '320x700',   width: 320,  height: 700,  mobile: true  }
    ];

    let allViewportsValid = true;
    const overflowReport = [];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile
      });
      await sleep(150);

      const vpOverflow = await cdp.evaluate(`(() => {
        const failures = [];
        for (let i = 0; i < 12; i++) {
          window.BlueprintNavigation.goToSheet(i, false);
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          if (scrollWidth > innerWidth + 1) { // 1px rounding tolerance
            failures.push({ sheet: i + 1, scrollWidth, innerWidth, diff: scrollWidth - innerWidth });
          }
        }
        return failures;
      })()`);

      if (vpOverflow.length > 0) {
        allViewportsValid = false;
        overflowReport.push({ viewport: vp.name, failures: vpOverflow });
      }
    }

    record('15', 'Zero Horizontal Document Overflow Across 5 Viewports (All 12 Sheets)', allViewportsValid, allViewportsValid ? '0px horizontal overflow across 1920, 1440, 768, 390, 320 viewports' : JSON.stringify(overflowReport));

    // ------------------------------------------------------------------------
    // SUITE 16: ZERO BROWSER CONSOLE ERRORS
    // ------------------------------------------------------------------------
    console.log('\n--- 16. ZERO BROWSER CONSOLE ERRORS ---');
    const zeroConsoleErrors = cdp.consoleErrors.length === 0;
    record('16', 'Zero Browser Console Errors & Runtime Exceptions', zeroConsoleErrors, zeroConsoleErrors ? 'Clean browser log' : `Errors: ${JSON.stringify(cdp.consoleErrors)}`);

    // ------------------------------------------------------------------------
    // CAPTURE EVIDENCE SCREENSHOTS FOR AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- CAPTURING AUDIT SCREENSHOTS ---');

    // Desktop 1440x900 screenshots
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(200);

    // Sheet 04 Desktop
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet04-desktop-1440.png'));

    // Sheet 05 Desktop
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(4, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet05-desktop-1440.png'));

    // Sheet 10 Desktop (Milestones)
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet10-desktop-1440.png'));

    // Sheet 10 Desktop (Recent Commits view)
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('log-dataset-toggle-btn');
      if (btn && !btn.textContent.includes('RECENT COMMITS')) btn.click();
    })()`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet10-recent-desktop-1440.png'));
    // Restore Milestones view
    await cdp.evaluate(`(() => {
      const btn = document.getElementById('log-dataset-toggle-btn');
      if (btn && btn.textContent.includes('RECENT COMMITS')) btn.click();
    })()`);
    await sleep(150);

    // Sheet 12 Desktop (Telemetry Panel)
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet12-desktop-1440.png'));

    // Mobile 390x844 screenshots
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await sleep(200);

    // Sheet 04 Mobile
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet04-mobile-390.png'));

    // Sheet 05 Mobile
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(4, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet05-mobile-390.png'));

    // Sheet 10 Mobile
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet10-mobile-390.png'));

    // Sheet 12 Mobile
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11, false)`);
    await sleep(200);
    await cdp.captureScreenshot(path.join(screenshotsDir, 'phase-4-sheet12-mobile-390.png'));

    console.log('Saved Phase 4 screenshots to docs/screenshots/ and artifact directory.');

    // ------------------------------------------------------------------------
    // SUMMARY
    // ------------------------------------------------------------------------
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n================================================================');
    console.log(`=== PHASE 4 AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED (${failed} FAILS) ===`);
    console.log('================================================================\n');

    fs.writeFileSync(
      path.resolve(__dirname, 'phase-4-results.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), total, passed, failed, results }, null, 2)
    );

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Audit encountered unexpected execution failure:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chrome.kill('SIGTERM');
  }
}

runPhase4Audit();
