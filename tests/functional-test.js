/**
 * BLUEPRINT / FORGE RUNTIME — AUTOMATED FUNCTIONAL TEST SUITE
 * Uses Native Chrome DevTools Protocol via Node.js
 */

const { spawn } = require('child_process');
const http = require('http');

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
  const harnessName = options.harnessName || 'Functional Test Suite';
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
      throw new Error(res.exceptionDetails.text || 'Evaluation failed');
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    this.ws.close();
  }
}

async function runTests() {
  console.log('--- STARTING BLUEPRINT PHASE 1 FUNCTIONAL TEST SUITE ---');

  // 1. Launch Chrome Headless with Remote Debugging
  const port = 9333;
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
    // Wait for Chrome CDP port to open with resilient 30-second deadline & process monitoring
    const { targets, elapsedMs } = await waitForCdpReadiness(port, procState, {
      harnessName: 'tests/functional-test.js (Sheet 01)',
      timeoutMs: 30000,
      pollIntervalMs: 300
    });
    console.log(`[INIT] Chrome DevTools Protocol ready on port ${port} in ${elapsedMs}ms`);

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Deterministic readiness: wait until document.readyState === 'complete' and DOM is fully mounted
    for (let i = 0; i < 50; i++) {
      const isReady = await cdp.evaluate(`(() => {
        return document.readyState === 'complete' &&
               document.getElementById('input-mod-01') !== null &&
               document.getElementById('telemetry-node-name') !== null &&
               document.getElementById('telemetry-node-status') !== null;
      })()`);
      if (isReady) break;
      await sleep(100);
    }
    await sleep(200);

    // TEST 1: Page Title and Document Header
    const title = await cdp.evaluate('document.title');
    record('Page Title Check', title.includes('BLUEPRINT // FORGE RUNTIME'), title);

    const docId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    record('Document ID Check', docId === 'SAHA-BP-2026-01', docId);

    const rev = await cdp.evaluate('document.querySelectorAll(".meta-val")[1].textContent');
    record('Revision Check', rev === '0.1.0', rev);

    // TEST 2: Correct Professional Identity
    const subtitle = await cdp.evaluate('document.querySelector(".dossier-subtitle").textContent.trim()');
    record('Professional Subtitle Check', subtitle === 'SOFTWARE DEVELOPER // SYSTEMS & AI BUILDER', subtitle);

    const intro = await cdp.evaluate('document.querySelector(".dossier-intro").textContent');
    const hasUnverifiedClaims = intro.includes('scientific training') || intro.includes('scientific computation');
    record('Intro Verified Claims Check', !hasUnverifiedClaims && intro.includes('intelligent applications'), 'No unverified claims detected');

    // TEST 3: System Status Labels (No false claims)
    const statusLabel = await cdp.evaluate('document.querySelector(".status-label").textContent.trim()');
    record('Local Preview Status Label Check', statusLabel === 'LOCAL PREVIEW // RUNTIME DEV', statusLabel);

    const footerStamp = await cdp.evaluate('document.querySelector(".footer-stamp").textContent.trim()');
    record('Footer Status Stamp Check', footerStamp === 'STATUS: DESIGN SPECIFICATION', footerStamp);

    // TEST 4: Every Interactive Schematic Node Telemetry
    const nodes = [
      { id: 'input-mod-01', expectedName: 'INPUT 01: SENSORY & TELEMETRY INGESTION' },
      { id: 'input-mod-02', expectedName: 'INPUT 02: KNOWLEDGE & LOGIC MATRIX' },
      { id: 'input-mod-03', expectedName: 'INPUT 03: DISTRIBUTED AGENT SUBSYSTEM' },
      { id: 'forge-core', expectedName: 'CENTRAL FORGE SCHEDULER // KERNEL v0.1' },
      { id: 'output-mod', expectedName: 'OUTPUT MODULE: RENDER SURFACES' }
    ];

    for (const node of nodes) {
      await cdp.evaluate(`
        (function() {
          const el = document.getElementById('${node.id}');
          el.dispatchEvent(new Event('mouseenter'));
        })()
      `);

      let activeName = '';
      let activeStatus = '';
      for (let i = 0; i < 10; i++) {
        await sleep(40);
        activeName = await cdp.evaluate('document.getElementById("telemetry-node-name").textContent');
        activeStatus = await cdp.evaluate('document.getElementById("telemetry-node-status").textContent');
        if (activeName === node.expectedName) break;
      }
      record(`Schematic Node [${node.id}] Hover Telemetry`, activeName === node.expectedName, activeStatus);

      // Test reset on mouseleave
      await cdp.evaluate(`
        (function() {
          const el = document.getElementById('${node.id}');
          el.dispatchEvent(new Event('mouseleave'));
        })()
      `);

      let resetStatus = '';
      for (let i = 0; i < 10; i++) {
        await sleep(30);
        resetStatus = await cdp.evaluate('document.getElementById("telemetry-node-status").textContent');
        if (resetStatus.includes('SELECT NODE')) break;
      }
      record(`Schematic Node [${node.id}] Reset on Leave`, resetStatus.includes('SELECT NODE'), resetStatus);
    }

    // TEST 5: Keyboard Focus and Activation
    await cdp.evaluate(`
      (function() {
        const first = document.getElementById('input-mod-01');
        first.focus();
      })()
    `);

    let focusedName = '';
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      focusedName = await cdp.evaluate('document.getElementById("telemetry-node-name").textContent');
      if (focusedName === 'INPUT 01: SENSORY & TELEMETRY INGESTION') break;
    }
    record('Keyboard Focus Telemetry', focusedName === 'INPUT 01: SENSORY & TELEMETRY INGESTION', focusedName);

    // Test ArrowRight key cycling
    await cdp.evaluate(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    `);

    let cycledName = '';
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      cycledName = await cdp.evaluate('document.getElementById("telemetry-node-name").textContent');
      if (cycledName === 'INPUT 02: KNOWLEDGE & LOGIC MATRIX') break;
    }
    record('Keyboard ArrowRight Node Cycling', cycledName === 'INPUT 02: KNOWLEDGE & LOGIC MATRIX', cycledName);

    // Test Escape key reset
    await cdp.evaluate(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    `);

    let escStatus = '';
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      escStatus = await cdp.evaluate('document.getElementById("telemetry-node-status").textContent');
      if (escStatus.includes('SELECT NODE')) break;
    }
    record('Keyboard Escape Key Reset', escStatus.includes('SELECT NODE'), escStatus);

    // TEST 6: Action Button 1 - Inspect Schematic
    await cdp.evaluate(`
      document.getElementById('btn-inspect-schematic').click();
    `);

    let inspectActive = '';
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      inspectActive = await cdp.evaluate('document.getElementById("telemetry-node-name").textContent');
      if (inspectActive === 'CENTRAL FORGE SCHEDULER // KERNEL v0.1') break;
    }
    record('Action Button [INSPECT SCHEMATIC]', inspectActive === 'CENTRAL FORGE SCHEDULER // KERNEL v0.1', inspectActive);

    // TEST 7: Action Button 2 - GitHub Profile Link Attributes
    const ghLink = await cdp.evaluate(`
      (function() {
        const btn = document.querySelectorAll('.cad-btn')[1];
        return {
          href: btn.getAttribute('href'),
          target: btn.getAttribute('target'),
          rel: btn.getAttribute('rel')
        };
      })()
    `);
    const ghLinkValid = ghLink.href === 'https://github.com/sahasanchayan44-tech' &&
                        ghLink.target === '_blank' &&
                        ghLink.rel.includes('noopener');
    record('Action Link [GITHUB PROFILE ↗] Safety & Target', ghLinkValid, JSON.stringify(ghLink));

    // TEST 8: Action Button 3 - Specification Metrics
    await cdp.evaluate(`
      document.getElementById('btn-spec-details').click();
    `);

    let metricsName = '';
    for (let i = 0; i < 10; i++) {
      await sleep(30);
      metricsName = await cdp.evaluate('document.getElementById("telemetry-node-name").textContent');
      if (metricsName === 'SYSTEM SPECIFICATION PARAMETERS') break;
    }
    record('Action Button [SPECIFICATION METRICS]', metricsName === 'SYSTEM SPECIFICATION PARAMETERS', metricsName);

    // TEST 9: Console Errors Check
    const logs = await cdp.evaluate('window.__errors || []');
    record('Console Error Audit', logs.length === 0, `${logs.length} runtime errors`);

  } finally {
    procState.isCleaningUp = true;
    if (cdp) cdp.close();
    try {
      if (!chrome.killed) {
        chrome.kill('SIGTERM');
      }
    } catch (e) {}
  }

  const allPassed = results.every(r => r.passed);
  console.log('--- TEST SUMMARY ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
