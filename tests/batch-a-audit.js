/**
 * BLUEPRINT / FORGE RUNTIME — BATCH A CONSISTENCY AUDIT
 */

const { spawn, execSync } = require('child_process');
const http = require('http');

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
  console.log('--- STARTING BATCH A CONSISTENCY AUDIT ---');
  const port = 9334;
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
    await cdp.send('Page.navigate', { url: 'http://localhost:8088/index.html' });
    await sleep(1000);

    // 1. Audit Navigation Controller presence
    const hasNav = await cdp.evaluate('typeof window.BlueprintNavigation !== "undefined"');
    record('Navigation Controller Initialized', hasNav);

    // Helper to capture screenshot via CDP
    async function capture(filename) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      require('fs').writeFileSync(`/home/sanchayan/Projects/BLUEPRINT/${filename}`, Buffer.from(data, 'base64'));
    }

    // 2. Navigate to Sheet 02
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(1)'); // Sheet 02
    await sleep(300);
    const s02Active = await cdp.evaluate('document.getElementById("sheet-02").classList.contains("active-sheet")');
    const s02DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    record('Sheet 02 Activation & DocID', s02Active && s02DocId === 'SAHA-BP-2026-02', s02DocId);
    await capture('screenshot-sheet02.png');

    // Check Sheet 02 principles and properties
    const bioPrinciplesCount = await cdp.evaluate('document.querySelectorAll("#sheet-02 .principle-item").length');
    record('Sheet 02 Principles Count', bioPrinciplesCount === 3, `${bioPrinciplesCount} items`);

    // 3. Navigate to Sheet 03
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(2)'); // Sheet 03
    await sleep(300);
    const s03Active = await cdp.evaluate('document.getElementById("sheet-03").classList.contains("active-sheet")');
    const s03DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const categoriesCount = await cdp.evaluate('document.querySelectorAll("#sheet-03 .stack-category-card").length');
    record('Sheet 03 Activation & Categories', s03Active && s03DocId === 'SAHA-BP-2026-03' && categoriesCount === 6, `${categoriesCount} categories`);
    await capture('screenshot-sheet03.png');

    // 4. Navigate to Sheet 04
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(3)'); // Sheet 04
    await sleep(300);
    const s04Active = await cdp.evaluate('document.getElementById("sheet-04").classList.contains("active-sheet")');
    const s04DocId = await cdp.evaluate('document.querySelector(".meta-val").textContent');
    const projectCardsCount = await cdp.evaluate('document.querySelectorAll("#sheet-04 .project-card").length');
    record('Sheet 04 Activation & 9 Public Projects', s04Active && s04DocId === 'SAHA-BP-2026-04' && projectCardsCount === 9, `${projectCardsCount} projects`);
    await capture('screenshot-sheet04.png');

    // 5. Test jump link from Sheet 02 to Sheet 04
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(1)'); // Back to Sheet 02
    await sleep(100);
    await cdp.evaluate('document.querySelector("#sheet-02 [data-jump-sheet=\'sheet-04\']").click()');
    await sleep(200);
    const currentSheetAfterJump = await cdp.evaluate('window.BlueprintNavigation.getCurrentIndex()');
    record('Cross-Sheet Jump Link', currentSheetAfterJump === 3, `Landed on sheet index ${currentSheetAfterJump} (Sheet 04)`);

    // 6. Return to Sheet 01 and assert Sheet 01 remains fully functional
    await cdp.evaluate('window.BlueprintNavigation.goToSheet(0)'); // Back to Sheet 01
    await sleep(100);
    const s01Active = await cdp.evaluate('document.getElementById("sheet-01").classList.contains("active-sheet")');
    record('Sheet 01 Return & Integrity', s01Active);

  } finally {
    if (cdp) cdp.close();
    chrome.kill();
  }

  const allPassed = results.every(r => r.passed);
  console.log('--- BATCH A AUDIT SUMMARY ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) process.exit(1);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
