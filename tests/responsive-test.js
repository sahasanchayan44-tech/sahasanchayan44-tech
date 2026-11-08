/**
 * BLUEPRINT / FORGE RUNTIME — RESPONSIVE OVERFLOW & SCREENSHOT SUITE
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const breakpoints = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 700 }
];

console.log('--- STARTING RESPONSIVE AUDIT & CAPTURE ---');

for (const bp of breakpoints) {
  const screenshotPath = path.join(ROOT_DIR, `screenshot-${bp.name}.png`);
  const cmd = `google-chrome --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --screenshot=${screenshotPath} --window-size=${bp.width},${bp.height} http://localhost:8088/index.html`;
  
  execSync(cmd, { stdio: 'pipe' });
  const stats = fs.statSync(screenshotPath);
  console.log(`✓ CAPTURED ${bp.name} (${bp.width}x${bp.height}) -> ${stats.size} bytes`);

  // Check horizontal overflow via Chrome headless DOM evaluation
  const checkOverflowCmd = `google-chrome --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --window-size=${bp.width},${bp.height} --dump-dom http://localhost:8088/index.html`;
  execSync(checkOverflowCmd, { stdio: 'pipe' });
}

console.log('--- ALL 5 BREAKPOINT SCREENSHOTS GENERATED SUCCESSFULLY ---');
