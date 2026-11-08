/**
 * BLUEPRINT / FORGE RUNTIME — PHASE 3.2 CONDITIONAL ACCEPTANCE REMEDIATION AUDIT
 * Automated verification suite for Remediations R1, R2, and R3 using Chrome DevTools Protocol (CDP)
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

async function runPhase32RemediationAudit() {
  console.log('================================================================');
  console.log('=== BLUEPRINT: RUNNING PHASE 3.2 CONDITIONAL REMEDIATION AUDIT ===');
  console.log('================================================================\n');

  const port = 9355;
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

    const screenshotsDir = path.resolve(__dirname, '../docs/screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

    // ========================================================================
    // SECTION 1: REMEDIATION R1 — MOBILE COORDINATE STRIP VERIFICATION
    // ========================================================================
    console.log('\n--- 1. REMEDIATION R1: MOBILE COORDINATE STRIP ---');

    // Test R1.1: Mobile 390x844 Coordinate Span Visibility
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(200);

    const r1Mobile390 = await cdp.evaluate(`(() => {
      const topAside = document.querySelector('aside.coordinate-margin');
      const bottomAside = document.querySelectorAll('aside.coordinate-margin')[1];
      
      const topSpans = Array.from(topAside.querySelectorAll('span'));
      const bottomSpans = Array.from(bottomAside.querySelectorAll('span'));

      const topPrimaryVisible = window.getComputedStyle(topSpans[0]).display !== 'none';
      const topSecondary1Hidden = window.getComputedStyle(topSpans[1]).display === 'none';
      const topSecondary2Hidden = window.getComputedStyle(topSpans[2]).display === 'none';

      const bottomPrimaryVisible = window.getComputedStyle(bottomSpans[0]).display !== 'none';
      const bottomSecondary1Hidden = window.getComputedStyle(bottomSpans[1]).display === 'none';
      const bottomSecondary2Hidden = window.getComputedStyle(bottomSpans[2]).display === 'none';

      return {
        topPrimaryText: topSpans[0].textContent.trim(),
        bottomPrimaryText: bottomSpans[0].textContent.trim(),
        topCorrect: topPrimaryVisible && topSecondary1Hidden && topSecondary2Hidden,
        bottomCorrect: bottomPrimaryVisible && bottomSecondary1Hidden && bottomSecondary2Hidden,
        topAsideScrollWidth: topAside.scrollWidth,
        topAsideClientWidth: topAside.clientWidth,
        bottomAsideScrollWidth: bottomAside.scrollWidth,
        bottomAsideClientWidth: bottomAside.clientWidth
      };
    })()`);

    record(
      'R1-MOBILE-390',
      'Coordinate Margins Hide Secondary Spans at 390px',
      r1Mobile390.topCorrect && r1Mobile390.bottomCorrect,
      `Top Primary: "${r1Mobile390.topPrimaryText}", Bottom Primary: "${r1Mobile390.bottomPrimaryText}"`
    );

    // Capture screenshot mobile 390 remediation
    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-mobile-390-remediation.png'));

    // Test R1.2: Mobile 320x700 Coordinate Span Visibility
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 320,
      height: 700,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(200);

    const r1Mobile320 = await cdp.evaluate(`(() => {
      const topAside = document.querySelector('aside.coordinate-margin');
      const bottomAside = document.querySelectorAll('aside.coordinate-margin')[1];
      const topSpans = Array.from(topAside.querySelectorAll('span'));
      const bottomSpans = Array.from(bottomAside.querySelectorAll('span'));

      return {
        topCorrect: window.getComputedStyle(topSpans[0]).display !== 'none' &&
                    window.getComputedStyle(topSpans[1]).display === 'none' &&
                    window.getComputedStyle(topSpans[2]).display === 'none',
        bottomCorrect: window.getComputedStyle(bottomSpans[0]).display !== 'none' &&
                       window.getComputedStyle(bottomSpans[1]).display === 'none' &&
                       window.getComputedStyle(bottomSpans[2]).display === 'none'
      };
    })()`);

    record(
      'R1-MOBILE-320',
      'Coordinate Margins Hide Secondary Spans at 320px',
      r1Mobile320.topCorrect && r1Mobile320.bottomCorrect,
      'Confirmed at ultracompact 320px viewport'
    );

    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-mobile-320-remediation.png'));

    // Test R1.3: Desktop 1440x900 Preservation of Secondary Spans
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(200);

    const r1Desktop1440 = await cdp.evaluate(`(() => {
      const topAside = document.querySelector('aside.coordinate-margin');
      const bottomAside = document.querySelectorAll('aside.coordinate-margin')[1];
      const topSpans = Array.from(topAside.querySelectorAll('span'));
      const bottomSpans = Array.from(bottomAside.querySelectorAll('span'));

      const allTopVisible = topSpans.every(s => window.getComputedStyle(s).display !== 'none');
      const allBottomVisible = bottomSpans.every(s => window.getComputedStyle(s).display !== 'none');

      return {
        allTopVisible,
        allBottomVisible,
        topCount: topSpans.length,
        bottomCount: bottomSpans.length
      };
    })()`);

    record(
      'R1-DESKTOP-1440',
      'Desktop Coordinate Margins Preserve All Spans at 1440px',
      r1Desktop1440.allTopVisible && r1Desktop1440.allBottomVisible,
      `All ${r1Desktop1440.topCount} top and ${r1Desktop1440.bottomCount} bottom spans visible`
    );

    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-desktop-regression.png'));

    // ========================================================================
    // SECTION 2: REMEDIATION R2 — HORIZONTAL SCROLL CONTAINMENT VERIFICATION
    // ========================================================================
    console.log('\n--- 2. REMEDIATION R2: HORIZONTAL SCROLL CONTAINMENT ---');

    // Test R2.1: Outer Document Canvas 0px Overflow across all 12 sheets at 390px
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(200);

    let all390SheetsZeroOverflow = true;
    const sheetOverflowDetails390 = [];

    for (let i = 0; i < 12; i++) {
      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(${i}, false);`);
      await sleep(100);

      const check = await cdp.evaluate(`(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const canvas = document.querySelector('.blueprint-canvas');
        const canvasScrollWidth = canvas.scrollWidth;
        const canvasClientWidth = canvas.clientWidth;

        const hasDocOverflow = docScrollWidth > winWidth;
        const hasCanvasOverflow = canvasScrollWidth > canvasClientWidth;

        return {
          sheetId: window.BlueprintNavigation.getSheets()[${i}],
          docScrollWidth,
          winWidth,
          overflowPx: Math.max(0, docScrollWidth - winWidth),
          hasDocOverflow,
          hasCanvasOverflow
        };
      })()`);

      sheetOverflowDetails390.push(check);
      if (check.hasDocOverflow || check.hasCanvasOverflow) {
        all390SheetsZeroOverflow = false;
      }
    }

    record(
      'R2-OVERFLOW-390',
      'All 12 Sheets Zero Document Canvas Horizontal Overflow at 390px',
      all390SheetsZeroOverflow,
      all390SheetsZeroOverflow ? 'Max overflow: 0px across all sheets' : `Overflow detected: ${JSON.stringify(sheetOverflowDetails390.filter(s => s.hasDocOverflow))}`
    );

    // Test R2.2: Outer Document Canvas 0px Overflow across all 12 sheets at 320px
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 320,
      height: 700,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(200);

    let all320SheetsZeroOverflow = true;
    for (let i = 0; i < 12; i++) {
      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(${i}, false);`);
      await sleep(100);

      const check = await cdp.evaluate(`(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return { hasOverflow: docScrollWidth > winWidth };
      })()`);

      if (check.hasOverflow) all320SheetsZeroOverflow = false;
    }

    record(
      'R2-OVERFLOW-320',
      'All 12 Sheets Zero Document Canvas Horizontal Overflow at 320px',
      all320SheetsZeroOverflow,
      all320SheetsZeroOverflow ? 'Max overflow: 0px across all 12 sheets at 320px' : 'Overflow detected at 320px'
    );

    // Test R2.3: Sheet 06 Local Heatmap Containment at 390px
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(5, false);`); // Sheet 06
    await sleep(200);

    const sheet06Containment = await cdp.evaluate(`(() => {
      const frame = document.querySelector('.heatmap-frame');
      const container = document.querySelector('.heatmap-svg-container');
      const svg = container ? container.querySelector('svg') : null;

      const containerStyle = window.getComputedStyle(container);
      const isScrollable = containerStyle.overflowX === 'auto' || containerStyle.overflowX === 'scroll';
      const frameContained = frame.clientWidth <= window.innerWidth;
      const svgPreservedWidth = svg ? svg.getBoundingClientRect().width : 0;

      return {
        frameContained,
        isScrollable,
        svgPreservedWidth,
        containerScrollWidth: container.scrollWidth,
        containerClientWidth: container.clientWidth
      };
    })()`);

    record(
      'R2-HEATMAP-CONTAINMENT',
      'Sheet 06 Heatmap Contained Locally Without Document Spill',
      sheet06Containment.frameContained && sheet06Containment.isScrollable && sheet06Containment.svgPreservedWidth >= 680,
      `Frame contained: ${sheet06Containment.frameContained}, Scrollable: ${sheet06Containment.isScrollable}, Preserved SVG: ${sheet06Containment.svgPreservedWidth}px`
    );

    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-mobile-390-sheet06-contained.png'));

    // Test R2.4: Sheet 10 Local Logbook Containment at 390px
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(9, false);`); // Sheet 10
    await sleep(200);

    const sheet10Containment = await cdp.evaluate(`(() => {
      const wrap = document.querySelector('.logbook-table-wrap');
      const table = wrap ? wrap.querySelector('.logbook-table') : null;
      const wrapStyle = window.getComputedStyle(wrap);
      const isScrollable = wrapStyle.overflowX === 'auto' || wrapStyle.overflowX === 'scroll';
      const wrapContained = wrap.clientWidth <= window.innerWidth;
      const tableWidth = table ? table.getBoundingClientRect().width : 0;

      return {
        wrapContained,
        isScrollable,
        tableWidth,
        wrapScrollWidth: wrap.scrollWidth,
        wrapClientWidth: wrap.clientWidth
      };
    })()`);

    record(
      'R2-LOGBOOK-CONTAINMENT',
      'Sheet 10 Logbook Table Contained Locally Without Document Spill',
      sheet10Containment.wrapContained && sheet10Containment.isScrollable && sheet10Containment.tableWidth >= 700,
      `Wrap contained: ${sheet10Containment.wrapContained}, Scrollable: ${sheet10Containment.isScrollable}, Preserved Table: ${sheet10Containment.tableWidth}px`
    );

    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-mobile-390-sheet10-contained.png'));

    // Test R2.5: Sheet 12 Local Master Index Containment at 390px
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11, false);`); // Sheet 12
    await sleep(200);

    const sheet12Containment = await cdp.evaluate(`(() => {
      const wrap = document.querySelector('.master-index-table-wrap');
      const table = wrap ? wrap.querySelector('.master-index-table') : null;
      const wrapStyle = window.getComputedStyle(wrap);
      const isScrollable = wrapStyle.overflowX === 'auto' || wrapStyle.overflowX === 'scroll';
      const wrapContained = wrap.clientWidth <= window.innerWidth;
      const tableWidth = table ? table.getBoundingClientRect().width : 0;

      return {
        wrapContained,
        isScrollable,
        tableWidth,
        wrapScrollWidth: wrap.scrollWidth,
        wrapClientWidth: wrap.clientWidth
      };
    })()`);

    record(
      'R2-INDEX-CONTAINMENT',
      'Sheet 12 Master Index Contained Locally Without Document Spill',
      sheet12Containment.wrapContained && sheet12Containment.isScrollable && sheet12Containment.tableWidth >= 750,
      `Wrap contained: ${sheet12Containment.wrapContained}, Scrollable: ${sheet12Containment.isScrollable}, Preserved Table: ${sheet12Containment.tableWidth}px`
    );

    // ========================================================================
    // SECTION 3: REMEDIATION R3 — MODAL KEYBOARD ACCESSIBILITY VERIFICATION
    // ========================================================================
    console.log('\n--- 3. REMEDIATION R3: MODAL KEYBOARD ACCESSIBILITY ---');

    // Return to standard desktop for modal testing
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3, false);`); // Sheet 04
    await sleep(200);

    // Test R3.1: Modal Dialog Semantics
    const modalSemantics = await cdp.evaluate(`(() => {
      const modal = document.getElementById('project-modal');
      return {
        role: modal.getAttribute('role'),
        ariaModal: modal.getAttribute('aria-modal'),
        ariaLabelledby: modal.getAttribute('aria-labelledby'),
        ariaDescribedby: modal.getAttribute('aria-describedby'),
        hasTitleElem: !!document.getElementById('modal-repo-title'),
        hasDescElem: !!document.getElementById('modal-repo-desc')
      };
    })()`);

    record(
      'R3-MODAL-SEMANTICS',
      'Modal Dialog Complete WAI-ARIA Semantics',
      modalSemantics.role === 'dialog' &&
      modalSemantics.ariaModal === 'true' &&
      modalSemantics.ariaLabelledby === 'modal-repo-title' &&
      modalSemantics.ariaDescribedby === 'modal-repo-desc' &&
      modalSemantics.hasTitleElem &&
      modalSemantics.hasDescElem,
      `role="${modalSemantics.role}", aria-modal="${modalSemantics.ariaModal}", labelledby="${modalSemantics.ariaLabelledby}", describedby="${modalSemantics.ariaDescribedby}"`
    );

    // Test R3.2: Keyboard Trigger & Initial Focus Entry
    const initialFocusTest = await cdp.evaluate(`(() => {
      const firstCard = document.querySelector('#sheet-04 .project-card');
      firstCard.focus();
      const activeBefore = document.activeElement === firstCard;
      
      // Dispatch Enter on card
      firstCard.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      
      const modal = document.getElementById('project-modal');
      const isOpen = modal.classList.contains('open');
      const closeBtn = document.getElementById('modal-close-btn');
      const focusedOnClose = document.activeElement === closeBtn;

      return {
        activeBefore,
        isOpen,
        focusedOnClose,
        activeElementId: document.activeElement ? document.activeElement.id : null
      };
    })()`);

    record(
      'R3-FOCUS-ENTRY',
      'Keyboard Enter Opens Modal & Moves Focus to Close Button',
      initialFocusTest.activeBefore && initialFocusTest.isOpen && initialFocusTest.focusedOnClose,
      `Modal open: ${initialFocusTest.isOpen}, Active element: #${initialFocusTest.activeElementId}`
    );

    // Capture screenshot of open modal with visible focus
    await cdp.captureScreenshot(path.join(screenshotsDir, 'screenshot-modal-focus-trapped.png'));

    // Test R3.3: Keyboard Focus Trapping (Tab wrap from last element to first element)
    const tabWrapForwardTest = await cdp.evaluate(`(() => {
      const modal = document.getElementById('project-modal');
      const repoLink = document.getElementById('modal-repo-link');
      const closeBtn = document.getElementById('modal-close-btn');

      // Focus the last element (repoLink)
      repoLink.focus();
      const beforeActive = document.activeElement === repoLink;

      // Dispatch Tab keydown on window
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true }));

      const afterActive = document.activeElement === closeBtn;

      return {
        beforeActive,
        afterActive,
        activeElementId: document.activeElement ? document.activeElement.id : null
      };
    })()`);

    record(
      'R3-FOCUS-TRAP-TAB',
      'Tab Cycles Forward and Wraps from Last Element to First Element',
      tabWrapForwardTest.beforeActive && tabWrapForwardTest.afterActive,
      `Wrapped from #modal-repo-link to #${tabWrapForwardTest.activeElementId}`
    );

    // Test R3.4: Keyboard Focus Trapping (Shift+Tab wrap from first element to last element)
    const tabWrapBackwardTest = await cdp.evaluate(`(() => {
      const closeBtn = document.getElementById('modal-close-btn');
      const repoLink = document.getElementById('modal-repo-link');

      // Focus first element (closeBtn)
      closeBtn.focus();
      const beforeActive = document.activeElement === closeBtn;

      // Dispatch Shift+Tab keydown on window
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));

      const afterActive = document.activeElement === repoLink;

      return {
        beforeActive,
        afterActive,
        activeElementId: document.activeElement ? document.activeElement.id : null
      };
    })()`);

    record(
      'R3-FOCUS-TRAP-SHIFTTAB',
      'Shift+Tab Cycles Backward and Wraps from First Element to Last Element',
      tabWrapBackwardTest.beforeActive && tabWrapBackwardTest.afterActive,
      `Wrapped backwards from #modal-close-btn to #${tabWrapBackwardTest.activeElementId}`
    );

    // Test R3.5: Background Keyboard Navigation Guard While Modal Is Open
    const backgroundNavGuardTest = await cdp.evaluate(`(() => {
      const initialSheetIndex = window.BlueprintNavigation.getCurrentIndex(); // Should be 3 (Sheet 04)

      // Try navigating right with ArrowRight while modal is open
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      const afterArrowSheetIndex = window.BlueprintNavigation.getCurrentIndex();

      // Try navigating Home while modal is open
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      const afterHomeSheetIndex = window.BlueprintNavigation.getCurrentIndex();

      return {
        guarded: initialSheetIndex === 3 && afterArrowSheetIndex === 3 && afterHomeSheetIndex === 3,
        initialSheetIndex,
        afterArrowSheetIndex,
        afterHomeSheetIndex
      };
    })()`);

    record(
      'R3-BG-NAV-GUARD',
      'Background Sheet Navigation Prevented While Modal Is Active',
      backgroundNavGuardTest.guarded,
      `Sheet maintained at ${backgroundNavGuardTest.initialSheetIndex} (no background navigation)`
    );

    // Test R3.6: Escape Key Dismissal & Focus Restoration to Originating Card
    const escapeAndRestoreTest = await cdp.evaluate(`(() => {
      const firstCard = document.querySelector('#sheet-04 .project-card');

      // Press Escape to dismiss
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      const modal = document.getElementById('project-modal');
      const isClosed = !modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'true';
      const focusRestored = document.activeElement === firstCard;

      return {
        isClosed,
        focusRestored,
        activeElementTag: document.activeElement ? document.activeElement.tagName : null,
        activeElementClass: document.activeElement ? document.activeElement.className : null
      };
    })()`);

    record(
      'R3-ESCAPE-AND-RESTORE',
      'Escape Key Dismisses Modal and Cleanly Restores Focus to Originating Card',
      escapeAndRestoreTest.isClosed && escapeAndRestoreTest.focusRestored,
      `Modal closed: ${escapeAndRestoreTest.isClosed}, Focus restored: ${escapeAndRestoreTest.focusRestored} (${escapeAndRestoreTest.activeElementTag}.${escapeAndRestoreTest.activeElementClass})`
    );

    // Test R3.7: Safe Guard Against Missing or Unmounted Triggering Elements
    const safeGuardTest = await cdp.evaluate(`(() => {
      try {
        // Open modal programmatically without originating element
        window.BlueprintNavigation.goToSheet(3, false);
        // Direct call without DOM element
        const modal = document.getElementById('project-modal');
        modal.classList.add('open');
        // Now call closeProjectModal() directly
        // Test that closing does not throw error if originating element is null
        const closeBtn = document.getElementById('modal-close-btn');
        closeBtn.click();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()`);

    record(
      'R3-SAFEGUARD-FOCUS',
      'Safe Focus Guard Prevents Crashes on Missing/Unmounted Trigger Elements',
      safeGuardTest.success,
      'No runtime exceptions on orphan close call'
    );

    // ========================================================================
    // SECTION 4: STANDARDIZED HEADING TYPOGRAPHY VISUAL BOUNDING BOX AUDIT
    // ========================================================================
    console.log('\n--- 4. STANDARDIZED HEADING TYPOGRAPHY VISUAL BOUNDING BOX AUDIT ---');

    // Test 4.1: Desktop (1440x900) SVG Heading Bounding Box Containment
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(400);

    const desktopHeadingAudit = await cdp.evaluate(`(() => {
      const sheetIds = ['sheet-02', 'sheet-03', 'sheet-04', 'sheet-05', 'sheet-06', 'sheet-07', 'sheet-08', 'sheet-09', 'sheet-10', 'sheet-11', 'sheet-12'];
      const sheetResults = [];

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        // Activate sheet so getBoundingClientRect() can compute actual rendered geometry
        window.BlueprintNavigation.goToSheet(i + 1, false);

        const sheet = document.getElementById(id);
        const h2 = sheet.querySelector('.sheet-title-main');
        const svg = h2 ? h2.querySelector('.sheet-heading-vector') : null;
        if (!h2 || !svg) {
          sheetResults.push({ id, valid: false, reason: 'Missing h2 or svg' });
          continue;
        }

        const h2Rect = h2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Check for duplicate plain text
        let plainTextNodes = 0;
        for (let node of h2.childNodes) {
          if (node.nodeType === 3 && node.nodeValue.trim().length > 0) plainTextNodes++;
        }

        // Bounding box containment: SVG must not overflow parent h2 width or height by more than 1px
        const widthContained = svgRect.width <= (h2Rect.width + 1.5);
        const heightContained = svgRect.height <= (h2Rect.height + 1.5);
        // Realistic heading scale on desktop: height between 20px and 45px
        const normalScale = svgRect.height >= 20 && svgRect.height <= 45;

        sheetResults.push({
          id,
          valid: widthContained && heightContained && normalScale && plainTextNodes === 0,
          plainTextNodes,
          svgWidth: Math.round(svgRect.width),
          svgHeight: Math.round(svgRect.height),
          h2Width: Math.round(h2Rect.width),
          h2Height: Math.round(h2Rect.height)
        });
      }

      // Reset to Sheet 04
      window.BlueprintNavigation.goToSheet(3, false);

      return {
        allValid: sheetResults.every(r => r.valid),
        sheetResults
      };
    })()`);

    record(
      'TYPO-BOUNDING-BOX-DESKTOP',
      'Desktop Headings (Sheets 02-12) Bounding Box Strictly Contained & Sized to Normal Scale',
      desktopHeadingAudit.allValid,
      desktopHeadingAudit.allValid
        ? `All 11 sheets contained within parent h2 (H: ${desktopHeadingAudit.sheetResults[0].svgHeight}px, 0 plain text nodes)`
        : `Failures: ${JSON.stringify(desktopHeadingAudit.sheetResults.filter(r => !r.valid))}`
    );

    // Test 4.2: Mobile (390x844) SVG Heading Bounding Box Containment & Zero Canvas Spill
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(400);

    const mobileHeadingAudit = await cdp.evaluate(`(() => {
      const sheetIds = ['sheet-02', 'sheet-03', 'sheet-04', 'sheet-05', 'sheet-06', 'sheet-07', 'sheet-08', 'sheet-09', 'sheet-10', 'sheet-11', 'sheet-12'];
      const sheetResults = [];

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        window.BlueprintNavigation.goToSheet(i + 1, false);

        const sheet = document.getElementById(id);
        const h2 = sheet.querySelector('.sheet-title-main');
        const svg = h2 ? h2.querySelector('.sheet-heading-vector') : null;
        if (!h2 || !svg) {
          sheetResults.push({ id, valid: false, reason: 'Missing h2 or svg' });
          continue;
        }

        const h2Rect = h2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const widthContained = svgRect.width <= (h2Rect.width + 1.5);
        const heightContained = svgRect.height <= (h2Rect.height + 1.5);
        // Responsive mobile scale: height between 9px and 25px
        const normalScale = svgRect.height >= 9 && svgRect.height <= 25;

        sheetResults.push({
          id,
          valid: widthContained && heightContained && normalScale,
          svgWidth: Math.round(svgRect.width),
          svgHeight: Math.round(svgRect.height),
          h2Width: Math.round(h2Rect.width),
          h2Height: Math.round(h2Rect.height)
        });
      }

      // Reset to Sheet 04
      window.BlueprintNavigation.goToSheet(3, false);

      return {
        allValid: sheetResults.every(r => r.valid),
        sheetResults
      };
    })()`);

    record(
      'TYPO-BOUNDING-BOX-MOBILE',
      'Mobile Headings (Sheets 02-12) Bounding Box Strictly Contained Within Mobile Canvas',
      mobileHeadingAudit.allValid,
      mobileHeadingAudit.allValid
        ? `All 11 sheets contained within mobile viewport (SVG width: ${mobileHeadingAudit.sheetResults[0].svgWidth}px, H: ${mobileHeadingAudit.sheetResults[0].svgHeight}px)`
        : `Failures: ${JSON.stringify(mobileHeadingAudit.sheetResults.filter(r => !r.valid))}`
    );

    // ========================================================================
    // SECTION 5: RUNTIME CONSOLE HEALTH CHECK
    // ========================================================================
    console.log('\n--- 5. RUNTIME CONSOLE HEALTH CHECK ---');
    const zeroConsoleErrors = cdp.consoleErrors.length === 0;
    record(
      'CONSOLE-HEALTH',
      'Zero Uncaught Runtime Errors Across Remediation Tests',
      zeroConsoleErrors,
      zeroConsoleErrors ? 'Clean browser log' : `Errors: ${JSON.stringify(cdp.consoleErrors)}`
    );

    // Summary
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n================================================================');
    console.log(`=== REMEDIATION AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED (${failed} FAILS) ===`);
    console.log('================================================================\n');

    fs.writeFileSync(
      path.resolve(__dirname, 'phase-3-2-results.json'),
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

runPhase32RemediationAudit();
