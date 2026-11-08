/**
 * BLUEPRINT / FORGE RUNTIME — BATCH B CONSISTENCY AUDIT
 * Tests Sheets 05, 06, 07, 08: Navigation, Document IDs, Elements, SVG Diagrams, and Visual State
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

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

async function runAudit() {
  console.log('--- STARTING BATCH B CONSISTENCY AUDIT (SHEETS 05-08) ---');
  const port = 9335;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    'http://localhost:8088/index.html'
  ]);

  let cdp;
  const results = [];

  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} : ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        targets = await getJson(`http://127.0.0.1:${port}/json`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:8088/index.html' });
    await sleep(1000);

    // Capture helper
    const ROOT_DIR = require('path').resolve(__dirname, '..');
    async function capture(filename) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(require('path').join(ROOT_DIR, filename), Buffer.from(data, 'base64'));
    }

    // 1. Sheet 05: Live GitHub Activity
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(4)'); // Sheet 05 index 4
    await sleep(300);
    const s05Active = await cdp.evaluate('document.getElementById("sheet-05").classList.contains("active-sheet")');
    const s05DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const metricBoxes = await cdp.evaluate('document.querySelectorAll("#sheet-05 .metric-stat-box").length');
    const timelineItems = await cdp.evaluate('document.querySelectorAll("#sheet-05 .timeline-event-card").length');
    record('Sheet 05 Activation & DocID', s05Active && s05DocId === 'SAHA-BP-2026-05', s05DocId);
    record('Sheet 05 Verified Metrics', metricBoxes === 6, `${metricBoxes} metric boxes`);
    record('Sheet 05 Public Activity Timeline', timelineItems === 9, `${timelineItems} repo events`);
    await capture('screenshot-sheet05.png');

    // 2. Sheet 06: Contribution Analysis
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(5)'); // Sheet 06 index 5
    await sleep(300);
    const s06Active = await cdp.evaluate('document.getElementById("sheet-06").classList.contains("active-sheet")');
    const s06DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const heatmapSvg = await cdp.evaluate('!!document.querySelector("#sheet-06 .heatmap-svg-container svg")');
    const langBars = await cdp.evaluate('document.querySelectorAll("#sheet-06 .meter-row").length');
    record('Sheet 06 Activation & DocID', s06Active && s06DocId === 'SAHA-BP-2026-06', s06DocId);
    record('Sheet 06 52-Week CAD Heatmap Matrix', heatmapSvg, 'SVG Rendered');
    record('Sheet 06 Language Distribution Meters', langBars === 5, `${langBars} languages analyzed`);
    await capture('screenshot-sheet06.png');

    // 3. Sheet 07: Research & Experimentation
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(6)'); // Sheet 07 index 6
    await sleep(300);
    const s07Active = await cdp.evaluate('document.getElementById("sheet-07").classList.contains("active-sheet")');
    const s07DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const labCards = await cdp.evaluate('document.querySelectorAll("#sheet-07 .lab-card").length');
    record('Sheet 07 Activation & DocID', s07Active && s07DocId === 'SAHA-BP-2026-07', s07DocId);
    record('Sheet 07 Research Laboratories', labCards === 4, `${labCards} lab domains`);
    await capture('screenshot-sheet07.png');

    // 4. Sheet 08: System Architecture & Schematics
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(7)'); // Sheet 08 index 7
    await sleep(300);
    const s08Active = await cdp.evaluate('document.getElementById("sheet-08").classList.contains("active-sheet")');
    const s08DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const archSvg = await cdp.evaluate('!!document.querySelector("#sheet-08 .system-arch-svg-wrap svg")');
    record('Sheet 08 Activation & DocID', s08Active && s08DocId === 'SAHA-BP-2026-08', s08DocId);
    record('Sheet 08 4-Tier System Architectural Schematic', archSvg, 'CAD Vector Graphic Present');
    await capture('screenshot-sheet08.png');

    // 5. Test navigation mobile select dropdown sync
    const selectVal = await cdp.evaluate('document.getElementById("mobile-sheet-select").value');
    record('Navigation Dropdown Sync (Sheet 08)', selectVal === 'sheet-08', `Select value: ${selectVal}`);

  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }

  const allPassed = results.every(r => r.passed);
  console.log('--- BATCH B AUDIT SUMMARY ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) process.exit(1);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
