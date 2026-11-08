#!/usr/bin/env node
/**
 * BLUEPRINT Production Deployment & HTTP Health Verification Harness
 *
 * Verifies live production endpoints:
 * 1. Main Portfolio Application (/)
 * 2. Header Vector Asset (/assets/profile/blueprint-header.svg)
 * 3. Metrics Vector Asset (/assets/profile/blueprint-metrics.svg)
 * 4. Telemetry Snapshot Endpoint (/data/github-data.json)
 * 5. Cryptographic SHA-256 Parity between Local Snapshot and Live Endpoint
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sahasanchayan44-tech.github.io/sahasanchayan44-tech';
const LOCAL_DATA_PATH = path.resolve(__dirname, '../docs/data/github-data.json');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function record(name, passed, details = '') {
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${name} ${details ? '— ' + details : ''}`);
  } else {
    failedTests++;
    failures.push({ name, details });
    console.error(`[FAIL] ${name} ${details ? '— ' + details : ''}`);
  }
}

function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'BLUEPRINT-CI-Verifier/1.0' } }, (res) => {
      // Follow redirects
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
        const nextUrl = new URL(res.headers.location, url).href;
        return resolve(fetchUrl(nextUrl, maxRedirects - 1));
      }

      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          raw: buffer
        });
      });
    }).on('error', reject);
  });
}

async function verifyDeployment() {
  console.log('================================================================');
  console.log('=== BLUEPRINT PRODUCTION DEPLOYMENT & HEALTH VERIFICATION ===');
  console.log(`=== Target: ${BASE_URL} ===`);
  console.log('================================================================\n');

  try {
    // 1. Main Application Page
    console.log('--- 1. MAIN APPLICATION HOMEPAGE ---');
    const homeRes = await fetchUrl(`${BASE_URL}/`);
    const homePass = homeRes.statusCode === 200 && homeRes.body.includes('BLUEPRINT // FORGE RUNTIME — Sanchayan Saha');
    record('Production Homepage HTTP 200 OK', homePass,
      `Status: ${homeRes.statusCode}, Length: ${homeRes.body.length} bytes, Title verified: true`);

    // 2. Blueprint Header SVG Asset
    console.log('\n--- 2. BLUEPRINT HEADER SVG ASSET ---');
    const headerRes = await fetchUrl(`${BASE_URL}/assets/profile/blueprint-header.svg`);
    const headerPass = headerRes.statusCode === 200 && headerRes.body.includes('<svg') && headerRes.body.includes('SANCHAYAN SAHA');
    record('Production Header SVG HTTP 200 OK', headerPass,
      `Status: ${headerRes.statusCode}, Content-Type: ${headerRes.headers['content-type']}, Length: ${headerRes.body.length} bytes`);

    // 3. Blueprint Metrics SVG Asset
    console.log('\n--- 3. BLUEPRINT METRICS SVG ASSET ---');
    const metricsRes = await fetchUrl(`${BASE_URL}/assets/profile/blueprint-metrics.svg`);
    const metricsPass = metricsRes.statusCode === 200 && metricsRes.body.includes('<svg');
    record('Production Metrics SVG HTTP 200 OK', metricsPass,
      `Status: ${metricsRes.statusCode}, Content-Type: ${metricsRes.headers['content-type']}, Length: ${metricsRes.body.length} bytes`);

    // 4. Production Telemetry Endpoint
    console.log('\n--- 4. TELEMETRY DATA ENDPOINT & CRYPTOGRAPHIC PARITY ---');
    const telemRes = await fetchUrl(`${BASE_URL}/data/github-data.json`);
    let jsonValid = false;
    let liveSha = '';
    let localSha = '';

    if (telemRes.statusCode === 200) {
      try {
        const liveJson = JSON.parse(telemRes.body);
        jsonValid = Boolean(liveJson.user && liveJson.repositories && liveJson.provenance);
        liveSha = crypto.createHash('sha256').update(telemRes.raw).digest('hex');

        if (fs.existsSync(LOCAL_DATA_PATH)) {
          const localBuf = fs.readFileSync(LOCAL_DATA_PATH);
          localSha = crypto.createHash('sha256').update(localBuf).digest('hex');
        }
      } catch (e) {
        jsonValid = false;
      }
    }

    record('Production Telemetry HTTP 200 & Valid JSON', telemRes.statusCode === 200 && jsonValid,
      `Status: ${telemRes.statusCode}, Valid JSON: ${jsonValid}`);

    const parityPass = liveSha && localSha && liveSha === localSha;
    record('Local vs Live Telemetry Cryptographic Parity (SHA-256)', parityPass,
      parityPass ? `SHA: ${liveSha}` : `Live: ${liveSha} vs Local: ${localSha}`);

  } catch (err) {
    record('Live Network Requests Succeeded', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`=== DEPLOYMENT VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED ===`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

verifyDeployment();
