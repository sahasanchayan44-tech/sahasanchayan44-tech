/**
 * BLUEPRINT / FORGE RUNTIME — PHASE 3.1 READ-ONLY FINAL VERIFICATION SUITE
 * Strictly read-only audit across 60 sheet-viewport pairs, modal accessibility,
 * combined interaction controls, data authenticity, and visual regression.
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

async function runPhase31Audit() {
  console.log('================================================================');
  console.log('=== BLUEPRINT: RUNNING PHASE 3.1 READ-ONLY FINAL VERIFICATION ===');
  console.log('================================================================\n');

  const port = 9358;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    'http://localhost:8088/index.html'
  ]);

  let cdp;
  const reportData = {
    viewports: [],
    modalAccessibility: {},
    interactionVerification: {},
    dataAuthenticity: {},
    regression: {},
    consoleErrors: []
  };

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

    // Wait for document and controller ready
    for (let i = 0; i < 30; i++) {
      const ready = await cdp.evaluate(`Boolean(window.BlueprintNavigation && document.readyState === 'complete')`);
      if (ready) break;
      await sleep(100);
    }
    await sleep(200);

    const sheetCount = await cdp.evaluate(`window.BlueprintNavigation.getSheets().length`);
    console.log(`Initialized with ${sheetCount} sheets.\n`);

    // ========================================================================
    // 1. RESPONSIVE VERIFICATION: ALL 12 SHEETS ACROSS 5 VIEWPORTS (60 PAIRS)
    // ========================================================================
    console.log('--- TASK 1: RESPONSIVE VERIFICATION (12 SHEETS × 5 VIEWPORTS = 60 CHECKS) ---');
    const viewports = [
      { name: '1920x1080 (Desktop Large)', width: 1920, height: 1080, mobile: false },
      { name: '1440x900 (Desktop Standard)', width: 1440, height: 900, mobile: false },
      { name: '768x1024 (Tablet Portrait)', width: 768, height: 1024, mobile: false },
      { name: '390x844 (Mobile Modern)', width: 390, height: 844, mobile: true },
      { name: '320x700 (Mobile Compact)', width: 320, height: 700, mobile: true }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(150);

      const vpResult = {
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        sheets: []
      };

      for (let sIdx = 0; sIdx < 12; sIdx++) {
        await cdp.evaluate(`window.BlueprintNavigation.goToSheet(${sIdx})`);
        await sleep(100);

        const check = await cdp.evaluate(`(() => {
          const sheet = document.querySelectorAll('.sheet-container')[${sIdx}];
          const docScrollWidth = document.documentElement.scrollWidth;
          const docClientWidth = document.documentElement.clientWidth;
          const winWidth = window.innerWidth;
          const sheetScrollWidth = sheet ? sheet.scrollWidth : 0;

          // Check if toolbar is accessible
          const navBar = document.querySelector('.sheet-nav-toolbar');
          const navVisible = navBar ? window.getComputedStyle(navBar).display !== 'none' : false;

          // Elements overflowing viewport width
          const overflowEls = Array.from(sheet.querySelectorAll('*')).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.right > docClientWidth + 1;
          }).map(el => el.tagName + (el.className ? '.' + el.className : ''));

          return {
            sheetId: sheet.id,
            docScrollWidth,
            docClientWidth,
            winWidth,
            sheetScrollWidth,
            navVisible,
            overflowElementCount: overflowEls.length,
            overflowSamples: overflowEls.slice(0, 3)
          };
        })()`);

        // Document has overflow if docScrollWidth exceeds client width
        const hasOverflow = check.docScrollWidth > check.docClientWidth + 2;
        const passed = !hasOverflow && check.overflowElementCount === 0 && check.navVisible;

        vpResult.sheets.push({
          sheetId: check.sheetId,
          passed,
          hasOverflow,
          details: check
        });

        if (!passed) {
          console.log(`[RESPONSIVE FINDING] ${vp.name} on ${check.sheetId}: docScrollWidth=${check.docScrollWidth}, docClientWidth=${check.docClientWidth}, sheetOverflows=${check.overflowElementCount}`, check.overflowSamples);
        }
      }

      const allSheetsPassed = vpResult.sheets.every(s => s.passed);
      console.log(`[RESPONSIVE] ${vp.name}: ${allSheetsPassed ? '✓ 12/12 Sheets 0px Overflow' : '⚠ OVERFLOW FINDINGS DETECTED'}`);
      reportData.viewports.push(vpResult);
    }

    // Reset standard desktop viewport for subsequent interaction testing
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(200);

    // ========================================================================
    // 2. MODAL ACCESSIBILITY AUDIT (SHEET 04)
    // ========================================================================
    console.log('\n--- TASK 2: MODAL ACCESSIBILITY AUDIT (SHEET 04) ---');
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3)`); // Sheet 04
    await sleep(200);

    // 2.1 Open Modal using Keyboard (Focus card, dispatch Enter)
    const openWithKeyboard = await cdp.evaluate(`(() => {
      const card = document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]');
      if (!card) return { success: false, reason: 'Card not found' };
      card.focus();
      const isFocused = document.activeElement === card;
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const isOpen = document.getElementById('project-modal').classList.contains('open');
      const activeEl = document.activeElement;
      const closeBtn = document.getElementById('modal-close-btn');
      return {
        cardFocused: isFocused,
        modalOpened: isOpen,
        closeBtnFocused: activeEl === closeBtn,
        activeElementTag: activeEl ? (activeEl.tagName + '#' + activeEl.id) : null
      };
    })()`);
    console.log('[MODAL] Keyboard Open & Initial Focus:', openWithKeyboard);
    reportData.modalAccessibility.keyboardOpen = openWithKeyboard;

    // 2.2 Verify Escape Dismissal
    const escapeDismissal = await cdp.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const isOpen = document.getElementById('project-modal').classList.contains('open');
      const activeEl = document.activeElement;
      return {
        modalClosed: !isOpen,
        activeElementAfterEscape: activeEl ? (activeEl.tagName + (activeEl.id ? '#' + activeEl.id : '') + (activeEl.className ? '.' + activeEl.className : '')) : null
      };
    })()`);
    console.log('[MODAL] Escape Dismissal:', escapeDismissal);
    reportData.modalAccessibility.escapeDismissal = escapeDismissal;

    // 2.3 Verify Close Button Dismissal & Focus Return Check
    const closeBtnDismissal = await cdp.evaluate(`(() => {
      const card = document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]');
      card.click();
      const opened = document.getElementById('project-modal').classList.contains('open');
      const closeBtn = document.getElementById('modal-close-btn');
      if (closeBtn) closeBtn.click();
      const closed = !document.getElementById('project-modal').classList.contains('open');
      const activeEl = document.activeElement;
      const returnedToCard = activeEl === card;
      return {
        opened,
        closed,
        returnedToCard,
        activeElementAfterClose: activeEl ? (activeEl.tagName + (activeEl.id ? '#' + activeEl.id : '') + (activeEl.className ? '.' + activeEl.className : '')) : null
      };
    })()`);
    console.log('[MODAL] Close Button & Focus Return:', closeBtnDismissal);
    reportData.modalAccessibility.closeBtnDismissal = closeBtnDismissal;

    // 2.4 Verify Backdrop Dismissal
    const backdropDismissal = await cdp.evaluate(`(() => {
      const card = document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]');
      card.click();
      const opened = document.getElementById('project-modal').classList.contains('open');
      const modalBackdrop = document.getElementById('project-modal');
      modalBackdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, target: modalBackdrop }));
      const closed = !document.getElementById('project-modal').classList.contains('open');
      return { opened, closed };
    })()`);
    console.log('[MODAL] Backdrop Click Dismissal:', backdropDismissal);
    reportData.modalAccessibility.backdropDismissal = backdropDismissal;

    // 2.5 Verify Focus Trapping & Background Interactivity
    const focusTrappingCheck = await cdp.evaluate(`(() => {
      const card = document.querySelector('#sheet-04 .project-card[data-repo="portfolio"]');
      card.click();
      const modal = document.getElementById('project-modal');
      const hasAriaModal = modal.getAttribute('aria-modal') === 'true';
      const roleDialog = modal.getAttribute('role') === 'dialog';

      // Background elements check
      const bgCardTabindex = card.getAttribute('tabindex');
      const bgSearchTabindex = document.getElementById('repo-search-input').getAttribute('tabindex');

      // Test whether Tab listener exists on modal
      const hasTabTrapListener = false; // Inspecting codebase: no 'keydown' tab trapping handler in interactivity.js

      // Close modal to restore
      document.getElementById('modal-close-btn').click();

      return {
        hasAriaModal,
        roleDialog,
        bgCardTabindex,
        bgSearchTabindex,
        focusTrapImplemented: hasTabTrapListener
      };
    })()`);
    console.log('[MODAL] Focus Trapping & Background State:', focusTrappingCheck);
    reportData.modalAccessibility.focusTrapping = focusTrappingCheck;

    // ========================================================================
    // 3. INTERACTION VERIFICATION
    // ========================================================================
    console.log('\n--- TASK 3: ADVANCED INTERACTION VERIFICATION ---');

    // 3.1 Combined Search + Language/Category Filter
    const combinedFilterTest = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(3); // Sheet 04
      const input = document.getElementById('repo-search-input');
      const pyChip = document.querySelector('.lang-filter-btn[data-lang="Python"]');
      const aiCatChip = document.querySelector('.cat-filter-btn[data-cat="AI / ML"]');

      input.value = 'exam';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      pyChip.click();
      aiCatChip.click();
      const count1 = document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length;
      const title1 = count1 === 1 ? document.querySelector('#sheet-04 .project-card:not(.hidden-by-filter) .project-title').textContent.trim() : null;

      input.value = 'portfolio';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const count2 = document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length;

      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('.lang-filter-btn[data-lang="ALL"]').click();
      document.querySelector('.cat-filter-btn[data-cat="ALL"]').click();
      const countReset = document.querySelectorAll('#sheet-04 .project-card:not(.hidden-by-filter)').length;

      return {
        combinedMatchCount: count1,
        matchedTitle: title1,
        noMatchCount: count2,
        resetCount: countReset
      };
    })()`);
    console.log('[INTERACTION] Combined Filters:', combinedFilterTest);
    reportData.interactionVerification.combinedFilters = combinedFilterTest;

    // 3.2 Browser Back/Forward Across Multiple Sheets
    await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(0);
      window.BlueprintNavigation.goToSheet(3);
      window.BlueprintNavigation.goToSheet(7);
      window.BlueprintNavigation.goToSheet(10);
    })()`);
    await sleep(200);

    await cdp.evaluate(`window.history.back()`);
    await sleep(300);
    const back1Idx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);

    await cdp.evaluate(`window.history.back()`);
    await sleep(300);
    const back2Idx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);

    await cdp.evaluate(`window.history.back()`);
    await sleep(300);
    const back3Idx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);

    await cdp.evaluate(`window.history.forward()`);
    await sleep(300);
    const fwd1Idx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);

    await cdp.evaluate(`window.history.forward()`);
    await sleep(300);
    const fwd2Idx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);

    const multiHistoryResult = {
      sequence: '01 -> 04 -> 08 -> 11',
      backSteps: [back1Idx, back2Idx, back3Idx],
      forwardSteps: [fwd1Idx, fwd2Idx],
      passed: back1Idx === 7 && back2Idx === 3 && back3Idx === 0 && fwd1Idx === 3 && fwd2Idx === 7
    };
    console.log('[INTERACTION] Multi-Sheet History Routing:', multiHistoryResult);
    reportData.interactionVerification.multiHistory = multiHistoryResult;

    // 3.3 Mobile Dropdown Synchronization
    const mobileDropdownTest = await cdp.evaluate(`(() => {
      const select = document.getElementById('mobile-sheet-select');
      select.value = 'sheet-07';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const activeSheetId = document.querySelector('.sheet-container.active-sheet').id;
      const navLabel = document.getElementById('nav-active-sheet-name').textContent;
      const docId = document.querySelector('.meta-val').textContent;

      window.BlueprintNavigation.nextSheet();
      const selectAfterNext = select.value;

      return {
        activeSheetId,
        navLabel,
        docId,
        selectAfterNext,
        passed: activeSheetId === 'sheet-07' && docId === 'SAHA-BP-2026-07' && selectAfterNext === 'sheet-08'
      };
    })()`);
    console.log('[INTERACTION] Mobile Dropdown Sync:', mobileDropdownTest);
    reportData.interactionVerification.mobileDropdown = mobileDropdownTest;

    // 3.4 Sheet 08 Architecture Node Keyboard Interaction
    const sheet08KeyTest = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(7); // Sheet 08
      const node = document.querySelector('.arch-node-interactive[data-subsystem-key="ollama"]');
      if (!node) return { passed: false, reason: 'Node not found' };

      node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const title = document.getElementById('arch-ins-title').textContent.trim();
      const isActive = node.classList.contains('active-node');
      return {
        title,
        isActive,
        passed: title === 'Ollama & FastAPIs' && isActive
      };
    })()`);
    console.log('[INTERACTION] Sheet 08 Vector Node Keyboard Focus:', sheet08KeyTest);
    reportData.interactionVerification.sheet08Keyboard = sheet08KeyTest;

    // 3.5 Sheet 09 Roadmap Milestone Controls
    const sheet09MilestoneTest = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(8); // Sheet 09
      const item = document.querySelector('.roadmap-item[data-milestone-key="slam"]');
      if (!item) return { passed: false, reason: 'Milestone item not found' };
      item.click();
      const title = document.getElementById('roadmap-ins-title').textContent.trim();
      const phase = document.getElementById('roadmap-ins-phase').textContent.trim();
      const status = document.getElementById('roadmap-ins-status').textContent.trim();
      return {
        title,
        phase,
        status,
        passed: title === 'Autonomous Robotic Perception & SLAM' && status.includes('STRATEGIC TARGET')
      };
    })()`);
    console.log('[INTERACTION] Sheet 09 Roadmap Inspector:', sheet09MilestoneTest);
    reportData.interactionVerification.sheet09Milestone = sheet09MilestoneTest;

    // 3.6 Sheet 10 Sorting and Simultaneous Search/Filter
    const sheet10SimultaneousTest = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(9); // Sheet 10
      const search = document.getElementById('log-search-input');
      const select = document.getElementById('log-repo-select');
      const sortBtn = document.getElementById('log-sort-btn');

      search.value = 'commit';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      select.value = 'study-manager';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sortBtn.click();

      const visibleRows = Array.from(document.querySelectorAll('#sheet-10 .logbook-table tbody tr'))
        .filter(r => r.style.display !== 'none');
      const matchCount = visibleRows.length;
      const firstRowDate = visibleRows.length > 0 ? visibleRows[0].cells[1].textContent.trim() : null;
      const countBadge = document.getElementById('log-filter-count').textContent.trim();

      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      select.value = 'ALL';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sortBtn.click();

      return {
        matchCount,
        firstRowDate,
        countBadge,
        passed: matchCount === 1 && firstRowDate.includes('2026-03-28') && countBadge.includes('1 OF 11')
      };
    })()`);
    console.log('[INTERACTION] Sheet 10 Simultaneous Search/Filter/Sort:', sheet10SimultaneousTest);
    reportData.interactionVerification.sheet10Simultaneous = sheet10SimultaneousTest;

    // 3.7 Sheet 11 Clipboard Success and Fallback
    const sheet11ClipboardTest = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(10); // Sheet 11
      const btn = document.querySelector('.clipboard-copy-btn[data-copy-val]');
      if (!btn) return { passed: false, reason: 'Copy button not found' };
      const val = btn.getAttribute('data-copy-val');
      btn.click();
      const feedback = btn.textContent.trim();

      return {
        copyVal: val,
        buttonFeedback: feedback,
        passed: feedback.includes('COPIED')
      };
    })()`);
    console.log('[INTERACTION] Sheet 11 Clipboard Feedback & Fallback:', sheet11ClipboardTest);
    reportData.interactionVerification.sheet11Clipboard = sheet11ClipboardTest;

    // ========================================================================
    // 4. DATA AUTHENTICITY AUDIT
    // ========================================================================
    console.log('\n--- TASK 4: DATA AUTHENTICITY AUDIT ---');

    const dataAuthenticityCheck = await cdp.evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('#sheet-10 .logbook-table tbody tr'));
      const commitAudit = rows.map((r, i) => {
        const id = r.cells[0].textContent.trim();
        const date = r.cells[1].textContent.trim();
        const repo = r.cells[2].textContent.trim();
        const shaLink = r.cells[3].querySelector('a');
        const shaBadge = r.cells[3].querySelector('.manifest-status-badge');
        const shaText = shaLink ? shaLink.textContent.trim() : (shaBadge ? shaBadge.textContent.trim() : null);
        const shaHref = shaLink ? shaLink.getAttribute('href') : null;
        const msg = r.cells[4].textContent.trim();

        // Row 1 is local spec, Row 11 is root account link, Rows 2-10 are verified commit links
        const isValid = (i === 0 && shaText === 'LOCAL SPEC') ||
                        (i === 10 && shaHref === 'https://github.com/sahasanchayan44-tech') ||
                        (shaHref && shaHref.startsWith('https://github.com/sahasanchayan44-tech/'));

        return { id, date, repo, shaText, shaHref, isValid, msg: msg.substring(0, 40) + '...' };
      });
      const allCommitsValid = commitAudit.length === 11 && commitAudit.every(c => c.isValid);

      // 4.2 Check Static Heatmap Simulation Banner
      const heatmapBanner = document.querySelector('#sheet-06 .data-pipeline-banner');
      const bannerText = heatmapBanner ? heatmapBanner.textContent.trim() : '';
      const heatmapExplicitlyStatic = bannerText.includes('STATIC PREVIEW — NOT LIVE CONTRIBUTION DATA');

      // 4.3 Check Sheet 05 Telemetry Description (No claim of live sync)
      const statusVal = document.getElementById('telem-ins-expl') ? document.getElementById('telem-ins-expl').textContent : '';
      const noFalseLiveClaim = statusVal.includes('Static baseline') || statusVal.includes('Phase 0');

      // 4.4 Check Research Classifications
      const labBadges = Array.from(document.querySelectorAll('#sheet-07 .lab-card .legend-chip')).map(el => el.textContent.trim());
      const expectedTiers = [
        'EXPERIMENTAL CONCEPT',
        'DOCUMENTED PROTOTYPE',
        'DOCUMENTED PROJECT',
        'ACTIVE INTEREST'
      ];
      const labTiersMatch = labBadges.length === 4 && labBadges.every((b, i) => b.includes(expectedTiers[i]) || expectedTiers.some(t => b.includes(t)));

      // 4.5 Check Professional Titles & Unverified Claims
      const docSubtitle = document.querySelector('.dossier-subtitle') ? document.querySelector('.dossier-subtitle').textContent.trim() : '';
      const statusLabel = document.querySelector('.status-label') ? document.querySelector('.status-label').textContent.trim() : '';
      const verifiedTitle = docSubtitle === 'SOFTWARE DEVELOPER // SYSTEMS & AI BUILDER';
      const honestStatus = statusLabel.includes('LOCAL PREVIEW // RUNTIME DEV');

      return {
        commitAudit,
        allCommitsValid,
        heatmapExplicitlyStatic,
        bannerText: bannerText.substring(0, 80) + '...',
        noFalseLiveClaim,
        labBadges,
        labTiersMatch,
        docSubtitle,
        verifiedTitle,
        statusLabel,
        honestStatus,
        allPassed: allCommitsValid && heatmapExplicitlyStatic && noFalseLiveClaim && labTiersMatch && verifiedTitle && honestStatus
      };
    })()`);
    console.log('[AUTHENTICITY] Commit links, banners, and claims check:', {
      allCommitsValid: dataAuthenticityCheck.allCommitsValid,
      heatmapExplicitlyStatic: dataAuthenticityCheck.heatmapExplicitlyStatic,
      noFalseLiveClaim: dataAuthenticityCheck.noFalseLiveClaim,
      labTiersMatch: dataAuthenticityCheck.labTiersMatch,
      verifiedTitle: dataAuthenticityCheck.verifiedTitle,
      honestStatus: dataAuthenticityCheck.honestStatus
    });
    reportData.dataAuthenticity = dataAuthenticityCheck;

    // ========================================================================
    // 5. REGRESSION AUDIT (SHEET 01 & 12 SHEETS INTEGRITY)
    // ========================================================================
    console.log('\n--- TASK 5: VISUAL REGRESSION & SHEET INTEGRITY AUDIT ---');

    const regressionCheck = await cdp.evaluate(`(() => {
      window.BlueprintNavigation.goToSheet(0);
      const sheet01 = document.getElementById('sheet-01');
      const hasDocHeader = Boolean(document.querySelector('.doc-header'));
      const hasEngineeringFrame = Boolean(document.querySelector('.engineering-frame'));
      const hasSchematicSvg = Boolean(document.querySelector('.schematic-svg-wrap svg'));
      const hasTelemetryBanner = Boolean(document.querySelector('.node-telemetry-banner'));
      const actionButtons = document.querySelectorAll('#sheet-01 .cad-btn').length;

      const expectedIds = [
        'sheet-01', 'sheet-02', 'sheet-03', 'sheet-04',
        'sheet-05', 'sheet-06', 'sheet-07', 'sheet-08',
        'sheet-09', 'sheet-10', 'sheet-11', 'sheet-12'
      ];
      const actualIds = Array.from(document.querySelectorAll('.sheet-container')).map(el => el.id);
      const allIdsMatch = expectedIds.every((id, idx) => actualIds[idx] === id);

      const tabBtns = document.querySelectorAll('.sheet-tab-btn').length;
      const mobileOptions = document.querySelectorAll('#mobile-sheet-select option').length;

      return {
        hasDocHeader,
        hasEngineeringFrame,
        hasSchematicSvg,
        hasTelemetryBanner,
        actionButtons,
        allIdsMatch,
        tabBtnCount: tabBtns,
        mobileOptionCount: mobileOptions,
        sheet01VisualIntact: hasDocHeader && hasEngineeringFrame && hasSchematicSvg && hasTelemetryBanner && actionButtons >= 3,
        navigationIntact: allIdsMatch && tabBtns === 12 && mobileOptions === 12
      };
    })()`);
    console.log('[REGRESSION] Visual & Sheet ID Integrity:', regressionCheck);
    reportData.regression = regressionCheck;

    // Capture visual confirmation of Sheet 01
    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-sheet01-regression.png'));

    // Capture visual confirmation of mobile viewports for findings
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(200);
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(5)`); // Sheet 06
    await sleep(200);
    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-mobile-390-sheet06.png'));
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9)`); // Sheet 10
    await sleep(200);
    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-mobile-390-sheet10.png'));
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11)`); // Sheet 12
    await sleep(200);
    await cdp.captureScreenshot(path.join(__dirname, '../screenshot-mobile-390-sheet12.png'));

    // Reset viewport to standard desktop
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(200);

    // Save final report data
    fs.writeFileSync(path.join(__dirname, '../tests/phase-3-1-results.json'), JSON.stringify(reportData, null, 2));
    console.log('\nFinal results saved to tests/phase-3-1-results.json');

  } catch (err) {
    console.error('Fatal error during Phase 3.1 audit:', err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }
}

runPhase31Audit();
