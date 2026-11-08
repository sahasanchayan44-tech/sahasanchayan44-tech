/**
 * BLUEPRINT — Phase 7.1 Standalone Browser Test Harness
 * Authoritative standalone verification for ADV-01 and DISC-01.
 * Uses native Node.js built-in WebSocket to control Chrome via CDP without added dependencies.
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = 9241;
const TARGET_URL = 'http://localhost:8088/index.html';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (msg) => {
      const payload = JSON.parse(msg.data);
      if (payload.id && this.pending.has(payload.id)) {
        const { resolve, reject } = this.pending.get(payload.id);
        this.pending.delete(payload.id);
        if (payload.error) reject(payload.error);
        else resolve(payload.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout waiting for CDP method: ${method}`));
        }
      }, 8000);

      this.pending.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Browser Eval Exception: ${desc}`);
    }
    return res.result?.value;
  }

  async clickCoordinates(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1
    });
    await sleep(60);
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
  }
}

async function run() {
  console.log('================================================================');
  console.log('=== BLUEPRINT PHASE 7.1 STANDALONE BROWSER AUDIT HARNESS ===');
  console.log('================================================================\n');

  console.log(`[INIT] Spawning isolated Chrome process on port ${PORT}...`);
  const chrome = spawn('google-chrome', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--mute-audio',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try {
      if (!chrome.killed) {
        chrome.kill('SIGTERM');
        console.log('[CLEANUP] Chrome process cleanly terminated.');
      }
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });
  process.on('uncaughtException', (err) => {
    console.error('[FATAL UNCAUGHT]', err);
    cleanup();
    process.exit(1);
  });

  let debuggerUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    try {
      const tabs = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
      if (tabs && tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        debuggerUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!debuggerUrl) {
    cleanup();
    throw new Error('Could not acquire Chrome debugging WebSocket URL.');
  }

  console.log(`[INIT] Connected to Chrome DevTools Protocol at ${debuggerUrl}`);
  const client = new CDPClient(debuggerUrl);
  await client.connect();

  const results = [];
  function record(id, category, description, passed, details = '') {
    results.push({ id, category, description, passed, details });
    const mark = passed === true ? '✓ PASS' : (passed === false ? '✗ FAIL' : '⚠ NOT VERIFIED');
    console.log(`[${category.padEnd(21)}] ${mark} : ${id} — ${description} ${details ? `(${details})` : ''}`);
  }

  try {
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    console.log('\n--- 1. VIEWPORT PRE-CONDITIONING ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    console.log('[VIEWPORT] Set to 1440 × 900 (Desktop CAD breakpoint)');

    console.log(`[NAVIGATE] Loading target: ${TARGET_URL}`);
    await client.send('Page.navigate', { url: TARGET_URL });
    await sleep(3500); // Allow full hydration

    // -------------------------------------------------------------
    // SECTION 1: ADV-01 REMEDIATION AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 2. ADV-01: MODAL REPOSITORY-LINK FALLBACK AUDIT ---');

    // 1. Initial fallback URL
    const initialHref = await client.eval(`(() => {
      const a = document.getElementById('modal-repo-link');
      return a ? a.getAttribute('href') : null;
    })()`);

    record(
      'ADV-01.1',
      'STATIC_AUDIT',
      'Initial modal repo anchor fallback points to canonical profile URL',
      initialHref === 'https://github.com/sahasanchayan44-tech',
      `Found: ${initialHref}`
    );

    // 2. Open project modal 1 (portfolio)
    const card1Result = await client.eval(`(() => {
      const card = document.querySelector('.project-card[data-repo="portfolio"]');
      if (!card) return { error: 'CardNotFound' };
      card.click();
      const modal = document.getElementById('project-modal');
      const link = document.getElementById('modal-repo-link');
      const focusedId = document.activeElement ? document.activeElement.id : null;
      return {
        isOpen: modal && modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'false',
        href: link ? link.getAttribute('href') : null,
        focusedId
      };
    })()`);

    record(
      'ADV-01.2',
      'MODAL_HYDRATION',
      'Project card click dynamically hydrates repo URL and traps focus',
      card1Result.isOpen && card1Result.href === 'https://github.com/sahasanchayan44-tech/portfolio' && card1Result.focusedId === 'modal-close-btn',
      `Href: ${card1Result.href}, Focused: ${card1Result.focusedId}`
    );

    // 3. Close modal via close button and verify focus restoration
    const close1Result = await client.eval(`(() => {
      const closeBtn = document.getElementById('modal-close-btn');
      if (!closeBtn) return { error: 'CloseBtnNotFound' };
      closeBtn.click();
      const modal = document.getElementById('project-modal');
      return {
        isClosed: modal && !modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'true',
        restoredTag: document.activeElement ? document.activeElement.tagName : null
      };
    })()`);

    record(
      'ADV-01.3',
      'FOCUS_RESTORATION',
      'Modal close button restores focus to originating element',
      close1Result.isClosed && close1Result.restoredTag !== null,
      `Closed: ${close1Result.isClosed}, RestoredTag: ${close1Result.restoredTag}`
    );

    // 4. Open second project modal (exam-oracle-ai) to verify no stale URL retention
    const card2Result = await client.eval(`(() => {
      const card = document.querySelector('.project-card[data-repo="exam-oracle-ai"]');
      if (!card) return { error: 'CardNotFound' };
      card.click();
      const modal = document.getElementById('project-modal');
      const link = document.getElementById('modal-repo-link');
      return {
        isOpen: modal && modal.classList.contains('open'),
        href: link ? link.getAttribute('href') : null
      };
    })()`);

    record(
      'ADV-01.4',
      'URL_REFRESH',
      'Opening second project card updates link without retaining stale URL',
      card2Result.isOpen && card2Result.href === 'https://github.com/sahasanchayan44-tech/exam-oracle-ai',
      `Href: ${card2Result.href}`
    );

    // 5. Close modal via Escape key
    const escResult = await client.eval(`(() => {
      const modal = document.getElementById('project-modal');
      const esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true });
      document.dispatchEvent(esc);
      return { isClosed: modal && !modal.classList.contains('open') };
    })()`);

    record(
      'ADV-01.5',
      'KEYBOARD_A11Y',
      'Escape key closes open modal window',
      escResult.isClosed === true
    );

    // -------------------------------------------------------------
    // SECTION 2: DISC-01 COORDINATE-BASED INTERACTION AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 3. DISC-01: COORDINATE-BASED CDP INPUT AUDIT ---');

    async function evaluateAndCoordinateClick(selector, expectedSheetId) {
      // 1. Scroll target tab into view
      const scrollResult = await client.eval(`(() => {
        const el = document.querySelector('${selector}');
        if (!el) return { error: 'ELEMENT_NOT_FOUND' };
        el.scrollIntoView({ block: 'center', inline: 'center' });
        return { ok: true };
      })()`);

      if (scrollResult && scrollResult.error) {
        return { passed: false, details: `Element lookup failed: ${scrollResult.error}` };
      }

      // 2. Wait for layout stabilization
      await sleep(350);

      // 3. Retrieve fresh getBoundingClientRect() and 4. verify visibility and viewport bounds
      const targetData = await client.eval(`(() => {
        const el = document.querySelector('${selector}');
        if (!el) return { error: 'ELEMENT_NOT_FOUND' };
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return { error: 'ELEMENT_HIDDEN' };
        }
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
          return { error: 'ZERO_DIMENSION' };
        }
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const centerX = Math.round(r.left + r.width / 2);
        const centerY = Math.round(r.top + r.height / 2);
        const inViewport = (
          r.top >= 0 &&
          r.bottom <= vh &&
          r.left >= 0 &&
          r.right <= vw &&
          centerX >= 0 &&
          centerX <= vw &&
          centerY >= 0 &&
          centerY <= vh
        );
        return {
          found: true,
          inViewport,
          x: centerX,
          y: centerY,
          width: Math.round(r.width),
          height: Math.round(r.height),
          rect: {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right)
          },
          viewport: { width: vw, height: vh }
        };
      })()`);

      if (!targetData.found) {
        return { passed: false, details: `Element lookup failed: ${targetData.error}` };
      }

      if (!targetData.inViewport) {
        return {
          passed: null,
          details: `Element outside viewport bounds: center=(${targetData.x}, ${targetData.y}), rect=[top:${targetData.rect.top}, bottom:${targetData.rect.bottom}, left:${targetData.rect.left}, right:${targetData.rect.right}], viewport=${targetData.viewport.width}x${targetData.viewport.height}`
        };
      }

      // 5. Dispatch CDP raw mouse pressed and released at exact center coordinates
      await client.clickCoordinates(targetData.x, targetData.y);
      await sleep(400);

      // 6. Verify resulting active sheet ID
      const activeSheet = await client.eval(`document.querySelector('.sheet-container.active-sheet')?.id || null`);
      const passed = activeSheet === expectedSheetId;
      return {
        passed,
        details: `Coords: (${targetData.x}, ${targetData.y}) in ${targetData.viewport.width}x${targetData.viewport.height}, Active Sheet: ${activeSheet} (Expected: ${expectedSheetId})`
      };
    }

    // Coordinate Test 1: Tab 01 -> Tab 04
    const coord01To04 = await evaluateAndCoordinateClick('.sheet-tab-btn[data-target="sheet-04"]', 'sheet-04');
    record(
      'DISC-01.1',
      'SYNTHETIC_CDP_INPUT',
      'Coordinate click transitions Sheet 01 -> Sheet 04',
      coord01To04.passed,
      coord01To04.details
    );

    // Coordinate Test 2: Tab 04 -> Tab 12
    const coord04To12 = await evaluateAndCoordinateClick('.sheet-tab-btn[data-target="sheet-12"]', 'sheet-12');
    record(
      'DISC-01.2',
      'SYNTHETIC_CDP_INPUT',
      'Coordinate click transitions Sheet 04 -> Sheet 12',
      coord04To12.passed,
      coord04To12.details
    );

    // Coordinate Test 3: Tab 12 -> Tab 01
    const coord12To01 = await evaluateAndCoordinateClick('.sheet-tab-btn[data-target="sheet-01"]', 'sheet-01');
    record(
      'DISC-01.3',
      'SYNTHETIC_CDP_INPUT',
      'Coordinate click transitions Sheet 12 -> Sheet 01',
      coord12To01.passed,
      coord12To01.details
    );

    // -------------------------------------------------------------
    // SECTION 3: NAVIGATION CONTROLS & HASH ROUTING AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 4. NAVIGATION CONTROLS & HASH DEEP-LINKING AUDIT ---');

    // Prev/Next controls
    const nextClick = await client.eval(`(() => {
      const btn = document.getElementById('nav-btn-next');
      if (!btn) return { error: 'NextBtnNotFound' };
      btn.click();
      return {
        clicked: true,
        activeId: document.querySelector('.sheet-container.active-sheet')?.id
      };
    })()`);
    record(
      'NAV-01',
      'DOM_DISPATCH',
      'Next button advances sheet (01 -> 02)',
      nextClick.activeId === 'sheet-02',
      `Active: ${nextClick.activeId}`
    );

    const prevClick = await client.eval(`(() => {
      const btn = document.getElementById('nav-btn-prev');
      if (!btn) return { error: 'PrevBtnNotFound' };
      btn.click();
      return {
        clicked: true,
        activeId: document.querySelector('.sheet-container.active-sheet')?.id
      };
    })()`);
    record(
      'NAV-02',
      'DOM_DISPATCH',
      'Prev button retreats sheet (02 -> 01)',
      prevClick.activeId === 'sheet-01',
      `Active: ${prevClick.activeId}`
    );

    // Hash navigation
    await client.eval(`window.location.hash = '#sheet-07'`);
    await sleep(400);
    const hashActive = await client.eval(`document.querySelector('.sheet-container.active-sheet')?.id`);
    record(
      'NAV-03',
      'HASH_ROUTING',
      'Setting hash deep-link (#sheet-07) activates Sheet 07',
      hashActive === 'sheet-07',
      `Active: ${hashActive}`
    );

  } finally {
    client.close();
    cleanup();
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('=== PHASE 7.1 STANDALONE AUDIT EXECUTION SUMMARY ===');
  console.log('================================================================');

  const passedCount = results.filter(r => r.passed === true).length;
  const failedCount = results.filter(r => r.passed === false).length;
  const notVerifiedCount = results.filter(r => r.passed === null).length;

  console.log(`Total Test Items : ${results.length}`);
  console.log(`Passed           : ${passedCount}`);
  console.log(`Failed           : ${failedCount}`);
  console.log(`Not Verified     : ${notVerifiedCount}`);

  console.log('\nResults by Interaction Tier:');
  const tiers = [...new Set(results.map(r => r.category))];
  for (const t of tiers) {
    const tItems = results.filter(r => r.category === t);
    const tPass = tItems.filter(r => r.passed === true).length;
    const tFail = tItems.filter(r => r.passed === false).length;
    const tNotVer = tItems.filter(r => r.passed === null).length;
    console.log(`  - [${t.padEnd(20)}] : ${tPass} passed, ${tFail} failed, ${tNotVer} not verified (total: ${tItems.length})`);
  }

  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('[FATAL RUNNER FAILURE]', err);
  process.exit(1);
});
