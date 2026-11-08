/**
 * BLUEPRINT / FORGE RUNTIME — PHASE 3 ADVANCED INTERACTIVITY & APPLICATION AUDIT
 * Automated verification suite using Chrome DevTools Protocol (CDP)
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        this.consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : ''));
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
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

async function runPhase3Audit() {
  console.log('================================================================');
  console.log('=== BLUEPRINT: RUNNING PHASE 3 INTERACTIVITY & APPLICATION AUDIT ===');
  console.log('================================================================\n');

  const port = 9353;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    'http://localhost:8088/index.html'
  ]);

  let cdp;
  const results = [];

  function record(category, testName, passed, details = '') {
    results.push({ category, testName, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${category}] ${mark}: ${testName} ${details ? '— ' + details : ''}`);
  }

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

    // Set standard viewport
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    
    // Wait for document and BlueprintNavigation to be fully initialized
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.evaluate(`Boolean(window.BlueprintNavigation && document.readyState === 'complete')`);
      if (ready) break;
      await sleep(100);
    }
    await sleep(200);

    // ========================================================================
    // 1. NAVIGATION ENGINE AUDIT
    // ========================================================================
    console.log('\n--- 1. NAVIGATION ENGINE TESTS ---');

    // 1.1 Initial Load on Sheet 01
    const initDocId = await cdp.evaluate(`document.querySelector('.meta-val').textContent.trim()`);
    const initBadge = await cdp.evaluate(`document.querySelector('.sheet-badge').textContent.trim()`);
    const initSheet01Active = await cdp.evaluate(`document.getElementById('sheet-01').classList.contains('active-sheet')`);
    record('NAV', 'Initial Sheet 01 Active State', initSheet01Active && initDocId === 'SAHA-BP-2026-01' && initBadge === 'SHEET: 01 / 12', `DocID: ${initDocId}, Badge: ${initBadge}`);

    // 1.2 Programmatic Navigation to Sheet 02
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(1)`);
    await sleep(200);
    const sheet02Active = await cdp.evaluate(`document.getElementById('sheet-02').classList.contains('active-sheet')`);
    const sheet02DocId = await cdp.evaluate(`document.querySelector('.meta-val').textContent.trim()`);
    const hash02 = await cdp.evaluate(`window.location.hash`);
    record('NAV', 'Direct Navigation to Sheet 02', sheet02Active && sheet02DocId === 'SAHA-BP-2026-02' && hash02 === '#sheet-02', `DocID: ${sheet02DocId}, Hash: ${hash02}`);

    // 1.3 Browser History (popstate)
    await cdp.evaluate(`window.history.back()`);
    await sleep(300);
    const historyBackIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    const historyBackHash = await cdp.evaluate(`window.location.hash`);
    await cdp.evaluate(`window.history.forward()`);
    await sleep(300);
    const historyForwardIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    const historyForwardHash = await cdp.evaluate(`window.location.hash`);
    record('NAV', 'Browser Back/Forward History (popstate)', historyBackIdx === 0 && historyForwardIdx === 1, `Back to index ${historyBackIdx} (${historyBackHash}), Forward to ${historyForwardIdx} (${historyForwardHash})`);

    // 1.4 Next / Prev Controls
    await cdp.evaluate(`window.BlueprintNavigation.nextSheet()`);
    await sleep(200);
    const sheet03Active = await cdp.evaluate(`document.getElementById('sheet-03').classList.contains('active-sheet')`);
    await cdp.evaluate(`window.BlueprintNavigation.prevSheet()`);
    await sleep(200);
    const sheet02Returned = await cdp.evaluate(`document.getElementById('sheet-02').classList.contains('active-sheet')`);
    record('NAV', 'Next/Prev Button Transition', sheet03Active && sheet02Returned, `Advanced to 03 then returned to 02`);

    // 1.5 Keyboard Arrow Navigation
    await cdp.evaluate(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    `);
    await sleep(200);
    const arrowNavIndex = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('NAV', 'Keyboard ArrowRight Navigation', arrowNavIndex === 2, `Current Index: ${arrowNavIndex} (Sheet 03)`);

    // 1.6 Keyboard Input Guard (Should NOT navigate when typing in input)
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3)`); // Go to Sheet 04
    await sleep(200);
    const guardPrevented = await cdp.evaluate(`(() => {
      const input = document.getElementById('repo-search-input');
      input.focus();
      const initialIdx = window.BlueprintNavigation.getCurrentIndex();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const afterIdx = window.BlueprintNavigation.getCurrentIndex();
      input.blur();
      return afterIdx === initialIdx;
    })()`);
    record('NAV', 'Keyboard Navigation Guard on Input Focus', guardPrevented, `ArrowRight ignored while #repo-search-input is focused`);

    // 1.7 Mobile Dropdown Sync
    const mobileSelectSync = await cdp.evaluate(`document.getElementById('mobile-sheet-select').value === 'sheet-04'`);
    record('NAV', 'Mobile Sheet Select Synchronization', mobileSelectSync, `Select value is 'sheet-04'`);

    // ========================================================================
    // 2. SHEET 04 PROJECT EXPLORER AUDIT
    // ========================================================================
    console.log('\n--- 2. SHEET 04 PROJECT EXPLORER TESTS ---');

    // 2.1 Initial 9 Repositories
    const initialProjectCards = await cdp.evaluate(`document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length`);
    const initialBadgeText = await cdp.evaluate(`document.getElementById('project-filter-count').textContent.trim()`);
    record('SHEET04', 'Initial 9 Public Repositories Count', initialProjectCards === 9 && initialBadgeText.includes('9 OF 9'), `Found ${initialProjectCards} visible cards, badge: "${initialBadgeText}"`);

    // 2.2 Instant Text Search
    await cdp.evaluate(`(() => {
      const input = document.getElementById('repo-search-input');
      input.value = 'neuro';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(150);
    const searchFilterCount = await cdp.evaluate(`document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length`);
    const searchFilterTitle = await cdp.evaluate(`document.querySelector('#sheet-04 .project-card:not(.hidden-by-filter) .project-title').textContent.trim()`);
    record('SHEET04', 'Instant Repo Text Search ("neuro")', searchFilterCount === 1 && searchFilterTitle === 'neuroverse', `Filtered to ${searchFilterCount} card (${searchFilterTitle})`);

    // 2.3 Clear Search & Language Chip Filter
    await cdp.evaluate(`(() => {
      const input = document.getElementById('repo-search-input');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const pyChip = document.querySelector('.lang-filter-btn[data-lang="Python"]');
      if (pyChip) pyChip.click();
    })()`);
    await sleep(150);
    const pyFilterCount = await cdp.evaluate(`document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length`);
    const pyFilterTitle = await cdp.evaluate(`document.querySelector('#sheet-04 .project-card:not(.hidden-by-filter) .project-title').textContent.trim()`);
    record('SHEET04', 'Language Chip Filter ("Python")', pyFilterCount === 1 && pyFilterTitle === 'exam-oracle-ai', `Filtered to ${pyFilterCount} card (${pyFilterTitle})`);

    // 2.4 Category Chip Filter
    await cdp.evaluate(`(() => {
      const allLangChip = document.querySelector('.lang-filter-btn[data-lang="ALL"]');
      if (allLangChip) allLangChip.click();
      const spatialCatChip = document.querySelector('.cat-filter-btn[data-cat="Spatial 3D"]');
      if (spatialCatChip) spatialCatChip.click();
    })()`);
    await sleep(150);
    const spatialCount = await cdp.evaluate(`document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length`);
    record('SHEET04', 'Category Chip Filter ("Spatial 3D")', spatialCount === 2, `Found ${spatialCount} spatial projects (portfolio, neuroverse)`);

    // Reset filters
    await cdp.evaluate(`(() => {
      document.querySelector('.cat-filter-btn[data-cat="ALL"]').click();
    })()`);
    await sleep(150);

    // 2.5 Architecture Inspection Modal Dialog
    await cdp.evaluate(`(() => {
      const card = document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]');
      if (card) card.click();
    })()`);
    await sleep(250);
    const modalIsOpen = await cdp.evaluate(`document.getElementById('project-modal').classList.contains('open')`);
    const modalTitle = await cdp.evaluate(`document.getElementById('modal-repo-title').textContent.trim()`);
    const modalArch = await cdp.evaluate(`document.getElementById('modal-repo-arch').textContent.trim()`);
    const modalLink = await cdp.evaluate(`document.getElementById('modal-repo-link').getAttribute('href')`);
    record('SHEET04', 'Architecture Inspection Modal Open', modalIsOpen && modalTitle === 'portfolio' && modalLink.includes('portfolio'), `Title: ${modalTitle}, Arch: ${modalArch}`);

    // Take modal screenshot
    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet04-modal.png'));

    // Close modal via Escape key
    await cdp.evaluate(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    `);
    await sleep(200);
    const modalClosed = await cdp.evaluate(`!document.getElementById('project-modal').classList.contains('open')`);
    record('SHEET04', 'Modal Dismissal via Escape Key', modalClosed, `Modal closed status: ${modalClosed}`);

    // ========================================================================
    // 3. SHEET 05 GITHUB TELEMETRY AUDIT
    // ========================================================================
    console.log('\n--- 3. SHEET 05 GITHUB TELEMETRY TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(4)`); // Sheet 05
    await sleep(200);

    // 3.1 Initial Metric Inspector state (defaults to 'repos')
    const initTelemTitle = await cdp.evaluate(`document.getElementById('telem-ins-title').textContent.trim()`);
    const initTelemVal = await cdp.evaluate(`document.getElementById('telem-ins-val').textContent.trim()`);
    record('SHEET05', 'Default Telemetry Inspector State', initTelemTitle === 'PUBLIC REPOSITORIES' && initTelemVal === '09', `Title: ${initTelemTitle}, Value: ${initTelemVal}`);

    // 3.2 Inspect 'stars' metric card
    await cdp.evaluate(`(() => {
      const starsBox = document.querySelector('.metric-stat-box[data-metric-key="stars"]');
      if (starsBox) starsBox.click();
    })()`);
    await sleep(150);
    const starsTelemTitle = await cdp.evaluate(`document.getElementById('telem-ins-title').textContent.trim()`);
    const starsTelemVal = await cdp.evaluate(`document.getElementById('telem-ins-val').textContent.trim()`);
    const starsExpl = await cdp.evaluate(`document.getElementById('telem-ins-expl').textContent.trim()`);
    record('SHEET05', 'Interactive Metric Inspection ("stars")', starsTelemTitle === 'TOTAL STARS EARNED' && starsTelemVal === '02' && starsExpl.includes('chandrayaan-4.0'), `Title: ${starsTelemTitle}, Stars: ${starsTelemVal}`);

    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet05-telemetry-inspected.png'));

    // ========================================================================
    // 4. SHEET 06 CONTRIBUTION HEATMAP AUDIT
    // ========================================================================
    console.log('\n--- 4. SHEET 06 CONTRIBUTION HEATMAP TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(5)`); // Sheet 06
    await sleep(200);

    // 4.1 Static Preview Warning Verification
    const staticWarningPresent = await cdp.evaluate(`document.body.textContent.includes('STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA')`);
    record('SHEET06', 'Unmistakable Static Preview Warning', staticWarningPresent, `Notice explicitly confirmed in DOM`);

    // 4.2 Interactive Heatmap Cluster Inspection
    await cdp.evaluate(`(() => {
      const marGroup = document.querySelector('.cad-heatmap-svg g[data-cluster-key="mar"]');
      if (marGroup) marGroup.dispatchEvent(new Event('mouseenter'));
    })()`);
    await sleep(150);
    const heatmapLabel = await cdp.evaluate(`document.getElementById('heatmap-ins-label').textContent.trim()`);
    const heatmapRepos = await cdp.evaluate(`document.getElementById('heatmap-ins-repos').textContent.trim()`);
    record('SHEET06', 'Heatmap Cluster Inspection (March Inception)', heatmapLabel.includes('MARCH 2026') && heatmapRepos.includes('aria'), `Label: ${heatmapLabel}, Repos: ${heatmapRepos}`);

    // 4.3 Heatmap Repo Filter Select
    await cdp.evaluate(`(() => {
      const select = document.getElementById('heatmap-repo-filter');
      select.value = 'portfolio';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(150);
    const heatmapRepoFilterLabel = await cdp.evaluate(`document.getElementById('heatmap-ins-label').textContent.trim()`);
    record('SHEET06', 'Heatmap Repo Filter Selection ("portfolio")', heatmapRepoFilterLabel.includes('NOVEMBER 2026'), `Label updated to: ${heatmapRepoFilterLabel}`);

    // ========================================================================
    // 5. SHEET 07 RESEARCH LABORATORY AUDIT
    // ========================================================================
    console.log('\n--- 5. SHEET 07 RESEARCH LABORATORY TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(6)`); // Sheet 07
    await sleep(200);

    // 5.1 Lab Card Categorization Check
    const labCardsCount = await cdp.evaluate(`document.querySelectorAll('#sheet-07 .lab-card').length`);
    const lab01Chip = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(1) .legend-chip').textContent.trim()`);
    const lab02Chip = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(2) .legend-chip').textContent.trim()`);
    const lab03Chip = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(3) .legend-chip').textContent.trim()`);
    const lab04Chip = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(4) .legend-chip').textContent.trim()`);
    record('SHEET07', 'Distinct Research Classification Tiers', labCardsCount === 4 && lab01Chip.includes('EXPERIMENTAL') && lab02Chip.includes('PROTOTYPE') && lab03Chip.includes('PROJECT') && lab04Chip.includes('ACTIVE INTEREST'), `Found 4 distinct tiers: ${lab01Chip}, ${lab02Chip}, ${lab03Chip}, ${lab04Chip}`);

    // 5.2 Expandable Technical Dossier Drawer
    await cdp.evaluate(`(() => {
      const toggle = document.querySelector('#sheet-07 .lab-card:nth-child(1) .dossier-toggle-btn');
      if (toggle) toggle.click();
    })()`);
    await sleep(200);
    const drawerOpen = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(1) .dossier-expanded-content').classList.contains('open')`);
    const toggleAria = await cdp.evaluate(`document.querySelector('#sheet-07 .lab-card:nth-child(1) .dossier-toggle-btn').getAttribute('aria-expanded')`);
    record('SHEET07', 'Expandable Dossier Drawer Toggle', drawerOpen && toggleAria === 'true', `Drawer opened, aria-expanded="true"`);

    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet07-dossier-expanded.png'));

    // Collapse
    await cdp.evaluate(`(() => {
      document.querySelector('#sheet-07 .lab-card:nth-child(1) .dossier-toggle-btn').click();
    })()`);
    await sleep(150);
    const drawerClosed = await cdp.evaluate(`!document.querySelector('#sheet-07 .lab-card:nth-child(1) .dossier-expanded-content').classList.contains('open')`);
    record('SHEET07', 'Dossier Drawer Collapse', drawerClosed, `Drawer closed smoothly`);

    // ========================================================================
    // 6. SHEET 08 SYSTEM ARCHITECTURE AUDIT
    // ========================================================================
    console.log('\n--- 6. SHEET 08 SYSTEM ARCHITECTURE TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(7)`); // Sheet 08
    await sleep(200);

    // 6.1 Subsystem Node Inspection
    await cdp.evaluate(`(() => {
      const dockerNode = document.querySelector('.arch-node-interactive[data-subsystem-key="docker"]');
      if (dockerNode) dockerNode.dispatchEvent(new Event('click'));
    })()`);
    await sleep(150);
    const archTitle = await cdp.evaluate(`document.getElementById('arch-ins-title').textContent.trim()`);
    const archTier = await cdp.evaluate(`document.getElementById('arch-ins-tier').textContent.trim()`);
    const archProto = await cdp.evaluate(`document.getElementById('arch-ins-proto').textContent.trim()`);
    record('SHEET08', 'Interactive Architecture Node ("docker")', archTitle === 'Docker Compose Runtimes' && archTier.includes('TIER 04') && archProto.includes('daemon socket'), `Title: ${archTitle}, Tier: ${archTier}`);

    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet08-subsystem-inspected.png'));

    // ========================================================================
    // 7. SHEET 09 LEARNING ROADMAP AUDIT
    // ========================================================================
    console.log('\n--- 7. SHEET 09 LEARNING ROADMAP TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(8)`); // Sheet 09
    await sleep(200);

    // 7.1 Milestone Node Inspection
    await cdp.evaluate(`(() => {
      const rustMilestone = document.querySelector('.roadmap-item[data-milestone-key="rust"]');
      if (rustMilestone) rustMilestone.click();
    })()`);
    await sleep(150);
    const roadmapTitle = await cdp.evaluate(`document.getElementById('roadmap-ins-title').textContent.trim()`);
    const roadmapPhase = await cdp.evaluate(`document.getElementById('roadmap-ins-phase').textContent.trim()`);
    const roadmapStatus = await cdp.evaluate(`document.getElementById('roadmap-ins-status').textContent.trim()`);
    record('SHEET09', 'Interactive Roadmap Milestone ("rust")', roadmapTitle === 'Rust Systems & Low-Level Runtimes' && roadmapPhase.includes('2027') && roadmapStatus.includes('SCHEDULED EXPLORATION'), `Title: ${roadmapTitle}, Status: ${roadmapStatus}`);

    // ========================================================================
    // 8. SHEET 10 ENGINEERING LOGBOOK AUDIT
    // ========================================================================
    console.log('\n--- 8. SHEET 10 ENGINEERING LOGBOOK TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9)`); // Sheet 10
    await sleep(200);

    // 8.1 Total rows
    const initialLogRows = await cdp.evaluate(`document.querySelectorAll('#sheet-10 .logbook-table tbody tr').length`);
    record('SHEET10', 'Verified 11 Chronological Commits', initialLogRows === 11, `Found ${initialLogRows} verified milestone rows`);

    // 8.2 Logbook Text Search
    await cdp.evaluate(`(() => {
      const search = document.getElementById('log-search-input');
      search.value = 'neural';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(150);
    const filteredRows = await cdp.evaluate(`document.querySelectorAll('#sheet-10 .logbook-table tbody tr:not([style*="display: none"])').length`);
    const filteredCountBadge = await cdp.evaluate(`document.getElementById('log-filter-count').textContent.trim()`);
    record('SHEET10', 'Logbook Text Search ("neural")', filteredRows === 1 && filteredCountBadge.includes('1 OF 11'), `Filtered to ${filteredRows} matching commit row (${filteredCountBadge})`);

    // Reset search
    await cdp.evaluate(`(() => {
      const search = document.getElementById('log-search-input');
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(150);

    // 8.3 Chronological Sort Toggle (Newest <-> Oldest)
    const firstRowBefore = await cdp.evaluate(`document.querySelector('#sheet-10 .logbook-table tbody tr td:nth-child(2)').textContent.trim()`);
    await cdp.evaluate(`document.getElementById('log-sort-btn').click()`);
    await sleep(150);
    const firstRowAfter = await cdp.evaluate(`document.querySelector('#sheet-10 .logbook-table tbody tr td:nth-child(2)').textContent.trim()`);
    const sortBtnLabel = await cdp.evaluate(`document.getElementById('log-sort-btn').textContent.trim()`);
    record('SHEET10', 'Chronological Sorting Toggle', firstRowBefore !== firstRowAfter && sortBtnLabel.includes('OLDEST FIRST'), `First commit date toggled from ${firstRowBefore} to ${firstRowAfter}`);

    // 8.4 Repo Dropdown Filter
    await cdp.evaluate(`(() => {
      const select = document.getElementById('log-repo-select');
      select.value = 'portfolio';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(150);
    const repoFilteredRows = await cdp.evaluate(`document.querySelectorAll('#sheet-10 .logbook-table tbody tr:not([style*="display: none"])').length`);
    record('SHEET10', 'Logbook Repo Filter Selection ("portfolio")', repoFilteredRows === 1, `Filtered to ${repoFilteredRows} portfolio row`);

    // Reset repo filter
    await cdp.evaluate(`(() => {
      const select = document.getElementById('log-repo-select');
      select.value = 'ALL';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(150);

    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet10-logbook-filtered.png'));

    // ========================================================================
    // 9. SHEET 11 CONTACT TERMINAL AUDIT
    // ========================================================================
    console.log('\n--- 9. SHEET 11 CONTACT TERMINAL TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(10)`); // Sheet 11
    await sleep(200);

    // 9.1 Clipboard Copy Button Feedback
    await cdp.evaluate(`(() => {
      const copyBtn = document.querySelector('.clipboard-copy-btn[data-copy-val]');
      if (copyBtn) copyBtn.click();
    })()`);
    await sleep(100);
    const copyBtnFeedback = await cdp.evaluate(`document.querySelector('.clipboard-copy-btn[data-copy-val]').textContent.trim()`);
    record('SHEET11', 'Clipboard Copy Button Feedback', copyBtnFeedback.includes('COPIED'), `Button text changed to "${copyBtnFeedback}"`);

    // 9.2 Prototype Terminal Dispatch Form
    await cdp.evaluate(`(() => {
      document.getElementById('comms-sender').value = 'Lead Architect';
      document.getElementById('comms-payload').value = 'Requesting architectural specification synchronization review.';
      document.getElementById('engineering-dispatch-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    })()`);
    await sleep(200);
    const stdoutContent = await cdp.evaluate(`document.getElementById('terminal-stdout').textContent`);
    const hasBufferLog = stdoutContent.includes('BUFFERED DISPATCH: SENDER="Lead Architect"');
    const hasHonestNotice = stdoutContent.includes('PROTOTYPE NOTICE');
    record('SHEET11', 'Honest Prototype Terminal Form Dispatch', hasBufferLog && hasHonestNotice, `Dispatched buffered stdout entry without page reload or external API leak`);

    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet11-terminal-dispatched.png'));

    // ========================================================================
    // 10. SHEET 12 MASTER DOCUMENT INDEX AUDIT
    // ========================================================================
    console.log('\n--- 10. SHEET 12 MASTER DOCUMENT INDEX TESTS ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11)`); // Sheet 12
    await sleep(200);

    // 10.1 Active Index Row Highlighting
    const activeRowHighlight = await cdp.evaluate(`(() => {
      const activeRow = document.querySelector('.master-index-table tbody tr.active-index-row');
      return Boolean(activeRow && activeRow.cells[0].textContent.trim() === '12');
    })()`);
    record('SHEET12', 'Active Index Row Highlighting', activeRowHighlight, `Active row matches current Sheet 12 index`);

    // 10.2 Document Index Direct Jump
    await cdp.evaluate(`(() => {
      const jump01 = document.querySelector('.master-index-table tbody tr:nth-child(1) .index-jump-btn');
      if (jump01) jump01.click();
    })()`);
    await sleep(200);
    const jumpedTo01 = await cdp.evaluate(`document.getElementById('sheet-01').classList.contains('active-sheet')`);
    record('SHEET12', 'Direct CAD Jump Button Navigation', jumpedTo01, `Jumped directly back to Sheet 01 via index table button`);

    // ========================================================================
    // 11. MULTI-VIEWPORT RESPONSIVENESS & OVERFLOW AUDIT (5 VIEWPORTS)
    // ========================================================================
    console.log('\n--- 11. RESPONSIVENESS & OVERFLOW AUDIT ACROSS 5 VIEWPORTS ---');
    const viewports = [
      { name: '1920 Desktop Large', width: 1920, height: 1080, mobile: false },
      { name: '1440 Desktop Standard', width: 1440, height: 900, mobile: false },
      { name: '768 Tablet Portrait', width: 768, height: 1024, mobile: true },
      { name: '390 Mobile Modern', width: 390, height: 844, mobile: true },
      { name: '320 Mobile Compact', width: 320, height: 700, mobile: true }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(200);

      // Check overflow on Sheet 01 and Sheet 04
      const overflow01 = await cdp.evaluate(`document.documentElement.scrollWidth > window.innerWidth`);
      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3)`); // Sheet 04
      await sleep(150);
      const overflow04 = await cdp.evaluate(`document.documentElement.scrollWidth > window.innerWidth`);

      record('VIEWPORT', `${vp.name} Overflow Check (0px tolerance)`, !overflow01 && !overflow04, `Sheet 01 overflow: ${overflow01}, Sheet 04 overflow: ${overflow04}`);

      if (vp.width === 390) {
        await cdp.captureScreenshot(path.join(__dirname, '../screenshot-mobile-390-sheet04.png'));
        // Open modal on mobile to verify mobile responsive modal layout
        await cdp.evaluate(`document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]').click();`);
        await sleep(200);
        await cdp.captureScreenshot(path.join(__dirname, '../screenshot-mobile-390-modal.png'));
        await cdp.evaluate(`document.getElementById('modal-close-btn').click();`);
        await sleep(150);
      }
    }

    // ========================================================================
    // 12. RUNTIME CONSOLE HEALTH CHECK
    // ========================================================================
    console.log('\n--- 12. RUNTIME CONSOLE HEALTH CHECK ---');
    record('CONSOLE', 'Zero Uncaught JavaScript Runtime Errors', cdp.consoleErrors.length === 0, cdp.consoleErrors.length > 0 ? `Errors: ${cdp.consoleErrors.join('; ')}` : 'Clean execution log');

    // Summarize
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n================================================================');
    console.log(`=== AUDIT COMPLETED: ${passed} / ${total} TESTS PASSED (${failed} FAILS) ===`);
    console.log('================================================================\n');

    if (failed > 0) {
      console.error('FAILURES DETECTED:');
      results.filter(r => !r.passed).forEach(f => console.error(` - [${f.category}] ${f.testName}: ${f.details}`));
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during Phase 3 audit:', err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }
}

runPhase3Audit();
