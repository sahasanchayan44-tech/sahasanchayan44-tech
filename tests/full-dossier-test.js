/**
 * BLUEPRINT / FORGE RUNTIME — COMPREHENSIVE 12-SHEET INTEGRATION & RESPONSIVE AUDIT
 * Tests:
 * 1. Sheet navigation across all 12 sheets (01-12)
 * 2. Header Document ID and footer sheet counter synchronization
 * 3. Keyboard navigation (ArrowRight, ArrowLeft)
 * 4. Hash URL navigation
 * 5. Sheet 01 schematic interactivity and telemetry
 * 6. Responsive audit across 5 viewports (1920, 1440, 768, 390, 320)
 * 7. Horizontal overflow detection
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });
  });
}

async function waitForCdpReadiness(port, procState, options = {}) {
  const harnessName = options.harnessName || 'Full Dossier Integration Harness';
  const timeoutMs = options.timeoutMs || 30000;
  const pollIntervalMs = options.pollIntervalMs || 300;
  const startTime = Date.now();

  let versionData = null;
  let targets = null;
  let lastStatus = 'Initiating readiness check';

  while (Date.now() - startTime < timeoutMs) {
    // 1. Process liveness check
    if (procState.exited) {
      const exitDetail = procState.spawnError
        ? `Spawn error: ${procState.spawnError.message}`
        : `Process exited with code ${procState.code} (signal: ${procState.signal})`;
      lastStatus = `Chrome process terminated unexpectedly: ${exitDetail}`;
      break;
    }

    // 2. Query /json/version first
    if (!versionData) {
      try {
        const ver = await getJson(`http://127.0.0.1:${port}/json/version`);
        if (ver && (ver.Browser || ver.webSocketDebuggerUrl)) {
          versionData = ver;
          lastStatus = `Version endpoint responsive (${ver.Browser || 'OK'})`;
        } else {
          lastStatus = 'Version endpoint returned invalid metadata';
        }
      } catch (err) {
        lastStatus = `Version endpoint not ready: ${err.message}`;
      }
    }

    // 3. Once /json/version is verified, query /json
    if (versionData) {
      try {
        const list = await getJson(`http://127.0.0.1:${port}/json`);
        if (Array.isArray(list) && list.length > 0) {
          const pageTarget = list.find(t => t.type === 'page') || list[0];
          if (pageTarget && pageTarget.webSocketDebuggerUrl) {
            targets = list;
            lastStatus = `Page target acquired: ${pageTarget.webSocketDebuggerUrl}`;
            break;
          } else {
            lastStatus = 'Targets present but missing webSocketDebuggerUrl';
          }
        } else {
          lastStatus = 'Target endpoint returned empty array';
        }
      } catch (err) {
        lastStatus = `Target endpoint not ready: ${err.message}`;
      }
    }

    await sleep(pollIntervalMs);
  }

  const elapsedMs = Date.now() - startTime;

  if (!targets || targets.length === 0) {
    const errorDetails = [
      `[CDP STARTUP FAILURE] ${harnessName}`,
      `Expected Port: ${port}`,
      `Elapsed Time: ${elapsedMs}ms (timeout: ${timeoutMs}ms)`,
      `Last Status: ${lastStatus}`,
      `Process Alive: ${!procState.exited}`,
      `Exit Code: ${procState.code !== null ? procState.code : 'N/A'}`,
      `Exit Signal: ${procState.signal !== null ? procState.signal : 'N/A'}`,
      `Spawn Error: ${procState.spawnError ? procState.spawnError.message : 'None'}`,
      `Version Endpoint Responsive: ${Boolean(versionData)}`,
      `Targets Available: ${Boolean(targets && targets.length > 0)}`,
      `Captured Stderr:\n${procState.stderr.trim() || '(empty)'}`
    ].join('\n  ');

    throw new Error(errorDetails);
  }

  return { versionData, targets, elapsedMs };
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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

  close() {
    this.ws.close();
  }
}

async function runFullDossierAudit() {
  console.log('=== STARTING COMPLETE 12-SHEET BLUEPRINT INTEGRATION AUDIT ===');
  // 1. Launch Chrome Headless with Remote Debugging
  const port = 9337;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--enable-logging=stderr',
    `--remote-debugging-port=${port}`,
    'http://localhost:8088/index.html'
  ]);

  const procState = {
    exited: false,
    code: null,
    signal: null,
    spawnError: null,
    isCleaningUp: false,
    stderr: ''
  };

  chrome.on('error', (err) => {
    procState.spawnError = err;
    procState.exited = true;
  });

  chrome.on('exit', (code, signal) => {
    procState.exited = true;
    procState.code = code;
    procState.signal = signal;
  });

  if (chrome.stderr) {
    chrome.stderr.on('data', chunk => {
      procState.stderr += chunk.toString();
    });
  }

  const emergencyCleanup = () => {
    procState.isCleaningUp = true;
    try {
      if (!chrome.killed) chrome.kill('SIGTERM');
    } catch (e) {}
  };
  process.on('SIGINT', emergencyCleanup);
  process.on('SIGTERM', emergencyCleanup);

  let cdp;
  const results = [];

  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} : ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    const { targets, elapsedMs } = await waitForCdpReadiness(port, procState, {
      harnessName: 'tests/full-dossier-test.js (Sheets 01-12 Integration)',
      timeoutMs: 30000,
      pollIntervalMs: 300
    });
    console.log(`[INIT] Chrome DevTools Protocol ready on port ${port} in ${elapsedMs}ms`);

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:8088/index.html' });
    await sleep(1000);

    // 1. Verify all 12 sheets existence in DOM
    const sheetIds = await cdp.evaluate(`
      Array.from(document.querySelectorAll('.sheet-container')).map(el => el.id)
    `);
    const expectedSheets = [
      'sheet-01', 'sheet-02', 'sheet-03', 'sheet-04',
      'sheet-05', 'sheet-06', 'sheet-07', 'sheet-08',
      'sheet-09', 'sheet-10', 'sheet-11', 'sheet-12'
    ];
    const allSheetsPresent = expectedSheets.every((id, idx) => sheetIds[idx] === id);
    record('All 12 Sheet Containers Present in DOM', allSheetsPresent && sheetIds.length === 12, `${sheetIds.length} sheets`);

    // 2. Iterate through all 12 sheets and verify doc ID and footer sheet counter
    let allDocIdsCorrect = true;
    for (let i = 0; i < 12; i++) {
      const sheetNum = String(i + 1).padStart(2, '0');
      const expectedDocId = `SAHA-BP-2026-${sheetNum}`;
      const expectedFooterLabel = `SHEET ${sheetNum} OF 12`;

      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(${i})`);
      await sleep(150);

      const activeId = await cdp.evaluate(`document.querySelector('.sheet-container.active-sheet').id`);
      const currentDocId = await cdp.evaluate(`document.querySelector('.meta-val').textContent`);
      const footerText = await cdp.evaluate(`document.getElementById('footer-sheet-label').textContent`);

      if (activeId !== expectedSheets[i] || currentDocId !== expectedDocId || footerText !== expectedFooterLabel) {
        allDocIdsCorrect = false;
        console.error(`Mismatch on sheet ${i}: active=${activeId}, docId=${currentDocId}, footer=${footerText}`);
      }
    }
    record('Doc ID & Footer Counters Synchronized (Sheets 01-12)', allDocIdsCorrect, 'All 12 verified');

    // 3. Test Navigation Toolbar Prev/Next Buttons
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(0)`); // back to 01
    await sleep(100);
    await cdp.evaluate(`document.getElementById('nav-btn-next').click()`);
    await sleep(150);
    let currentIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('Next Sheet Button Action (01 -> 02)', currentIdx === 1, `Current index: ${currentIdx}`);

    await cdp.evaluate(`document.getElementById('nav-btn-prev').click()`);
    await sleep(150);
    currentIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('Prev Sheet Button Action (02 -> 01)', currentIdx === 0, `Current index: ${currentIdx}`);

    // 4. Test Keyboard Arrow Navigation (ArrowRight / ArrowLeft)
    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await sleep(200);
    currentIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('Keyboard ArrowRight Navigation (01 -> 02)', currentIdx === 1, `Current index: ${currentIdx}`);

    await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
    await sleep(200);
    currentIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('Keyboard ArrowLeft Navigation (02 -> 01)', currentIdx === 0, `Current index: ${currentIdx}`);

    // 5. Test Hash URL Navigation
    await cdp.evaluate(`window.location.hash = '#sheet-07'`);
    await sleep(300);
    currentIdx = await cdp.evaluate(`window.BlueprintNavigation.getCurrentIndex()`);
    record('Hash URL Routing (#sheet-07)', currentIdx === 6, `Current index: ${currentIdx}`);

    // 6. Test Sheet 01 Schematic Hover & Telemetry Interactivity
    await cdp.evaluate(`window.BlueprintNavigation.goToSheet(0)`);
    await sleep(200);
    await cdp.evaluate(`
      (function() {
        const el = document.getElementById('forge-core');
        el.dispatchEvent(new Event('mouseenter'));
      })()
    `);
    await sleep(100);
    const telemName = await cdp.evaluate(`document.getElementById('telemetry-node-name').textContent`);
    const telemStatus = await cdp.evaluate(`document.getElementById('telemetry-node-status').textContent`);
    record('Sheet 01 Schematic Node Activation & Telemetry Update', telemName.includes('CENTRAL FORGE SCHEDULER') && telemStatus.includes('SPEC: CORE SCHEDULER MODEL'), `Name: ${telemName} // Status: ${telemStatus}`);

    // 7. Test Responsive Viewports and Horizontal Overflow
    const viewports = [
      { name: 'desktop-1920', width: 1920, height: 1080, mobile: false },
      { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
      { name: 'tablet-768', width: 768, height: 1024, mobile: false },
      { name: 'mobile-390', width: 390, height: 844, mobile: true },
      { name: 'mobile-320', width: 320, height: 700, mobile: true }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(300);

      // Check overflow on Sheet 01
      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(0)`);
      await sleep(150);
      const s01Overflow = await cdp.evaluate(`
        document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
      `);
      record(`Viewport ${vp.width}x${vp.height} (${vp.name}) No Overflow [Sheet 01]`, !s01Overflow);

      // Capture screenshot of Sheet 01 at this viewport
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ROOT_DIR, `screenshot-${vp.name}.png`), Buffer.from(data, 'base64'));

      // Check overflow on complex sheets (04 and 12)
      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(3)`); // Sheet 04
      await sleep(150);
      const s04Overflow = await cdp.evaluate(`
        document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
      `);
      record(`Viewport ${vp.width}x${vp.height} No Overflow [Sheet 04]`, !s04Overflow);

      await cdp.evaluate(`window.BlueprintNavigation.goToSheet(11)`); // Sheet 12
      await sleep(150);
      const s12Overflow = await cdp.evaluate(`
        document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth
      `);
      record(`Viewport ${vp.width}x${vp.height} No Overflow [Sheet 12]`, !s12Overflow);
    }

  } finally {
    procState.isCleaningUp = true;
    if (cdp) cdp.close();
    try {
      if (!chrome.killed) chrome.kill('SIGTERM');
    } catch (e) {}
  }

  const allPassed = results.every(r => r.passed);
  console.log('=== FULL DOSSIER INTEGRATION SUMMARY ===');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) process.exit(1);
}

runFullDossierAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
