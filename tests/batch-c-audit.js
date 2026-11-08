/**
 * BLUEPRINT / FORGE RUNTIME — BATCH C CONSISTENCY AUDIT
 * Tests Sheets 09, 10, 11, 12: Navigation, Document IDs, Elements, Jump Links, and Visual State
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
  console.log('--- STARTING BATCH C CONSISTENCY AUDIT (SHEETS 09-12) ---');
  const port = 9336;
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

    // 1. Sheet 09: Learning Roadmap
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(8)'); // Sheet 09 index 8
    await sleep(300);
    const s09Active = await cdp.evaluate('document.getElementById("sheet-09").classList.contains("active-sheet")');
    const s09DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const roadmapCards = await cdp.evaluate('document.querySelectorAll("#sheet-09 .roadmap-card").length');
    const roadmapItems = await cdp.evaluate('document.querySelectorAll("#sheet-09 .roadmap-item").length');
    record('Sheet 09 Activation & DocID', s09Active && s09DocId === 'SAHA-BP-2026-09', s09DocId);
    record('Sheet 09 Roadmap Phases', roadmapCards === 4, `${roadmapCards} phase cards`);
    record('Sheet 09 Roadmap Milestones', roadmapItems === 12, `${roadmapItems} milestone items`);
    await capture('screenshot-sheet09.png');

    // 2. Sheet 10: Engineering Logbook
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(9)'); // Sheet 10 index 9
    await sleep(300);
    const s10Active = await cdp.evaluate('document.getElementById("sheet-10").classList.contains("active-sheet")');
    const s10DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const logRows = await cdp.evaluate('document.querySelectorAll("#sheet-10 .logbook-table tbody tr").length');
    record('Sheet 10 Activation & DocID', s10Active && s10DocId === 'SAHA-BP-2026-10', s10DocId);
    record('Sheet 10 Verified Log Entries', logRows === 11, `${logRows} chronological records`);
    await capture('screenshot-sheet10.png');

    // 3. Sheet 11: Contact & Connections
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(10)'); // Sheet 11 index 10
    await sleep(300);
    const s11Active = await cdp.evaluate('document.getElementById("sheet-11").classList.contains("active-sheet")');
    const s11DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const commsLinks = await cdp.evaluate('document.querySelectorAll("#sheet-11 .comms-link-row").length');
    const dispatchForm = await cdp.evaluate('!!document.querySelector("#sheet-11 .contact-form-panel")');
    record('Sheet 11 Activation & DocID', s11Active && s11DocId === 'SAHA-BP-2026-11', s11DocId);
    record('Sheet 11 Communications Links', commsLinks === 3, `${commsLinks} channels`);
    record('Sheet 11 Dispatch Console Present', dispatchForm, 'Dispatch Form Present');
    await capture('screenshot-sheet11.png');

    // 4. Sheet 12: Master Document Index
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(11)'); // Sheet 12 index 11
    await sleep(300);
    const s12Active = await cdp.evaluate('document.getElementById("sheet-12").classList.contains("active-sheet")');
    const s12DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const indexRows = await cdp.evaluate('document.querySelectorAll("#sheet-12 .master-index-table tbody tr").length');
    const jumpButtons = await cdp.evaluate('document.querySelectorAll("#sheet-12 .index-jump-btn").length');
    const statBoxes = await cdp.evaluate('document.querySelectorAll("#sheet-12 .manifest-stat-box").length');
    record('Sheet 12 Activation & DocID', s12Active && s12DocId === 'SAHA-BP-2026-12', s12DocId);
    record('Sheet 12 Master Index Table (12 Sheets)', indexRows === 12, `${indexRows} sheets listed`);
    record('Sheet 12 Jump Buttons', jumpButtons === 12, `${jumpButtons} jump buttons`);
    record('Sheet 12 Compliance Stats', statBoxes === 4, `${statBoxes} summary boxes`);
    await capture('screenshot-sheet12.png');

    // 5. Test Cross-Sheet Jump from Sheet 12 to Sheet 03
    await cdp.evaluate('document.querySelector("#sheet-12 .index-jump-btn[data-jump-sheet=\'sheet-03\']").click()');
    await sleep(300);
    const landedSheetIndex = await cdp.evaluate('window.BlueprintNavigation.getCurrentIndex()');
    const s03Active = await cdp.evaluate('document.getElementById("sheet-03").classList.contains("active-sheet")');
    record('Index Jump Action (Sheet 12 -> Sheet 03)', landedSheetIndex === 2 && s03Active, `Landed on sheet index: ${landedSheetIndex}`);

  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }

  const allPassed = results.every(r => r.passed);
  console.log('--- BATCH C AUDIT SUMMARY ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) process.exit(1);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
