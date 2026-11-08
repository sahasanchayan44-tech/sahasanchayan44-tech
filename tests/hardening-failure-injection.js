/**
 * BLUEPRINT / FORGE RUNTIME — PHASE 4.2 FAILURE-INJECTION TESTS
 * Automated tests for schema validation, temporary file cleanup, and atomic snapshot preservation.
 * Runs in isolated temporary fixtures; never touches production data files.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { GitHubCollector, validateDraft07 } = require('../scripts/fetch-public-github-data.js');

function createTempDir(prefix) {
  const dir = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanTempDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function runHardeningTests() {
  console.log('================================================================');
  console.log('=== BLUEPRINT: RUNNING PHASE 4.2 FAILURE-INJECTION QA SUITE ===');
  console.log('================================================================\n');

  const results = [];
  function record(testId, name, passed, details = '') {
    results.push({ testId, name, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[TEST ${testId}] ${mark}: ${name} ${details ? '— ' + details : ''}`);
  }

  const rootDir = path.resolve(__dirname, '..');
  const validSnapshotPath = path.join(rootDir, 'docs/data/github-data.json');
  const schemaPath = path.join(rootDir, 'docs/data/github-data-schema.json');
  const pristineSnapshot = JSON.parse(fs.readFileSync(validSnapshotPath, 'utf8'));

  // ------------------------------------------------------------------------
  // TEST 1: INVALID SCHEMA PAYLOAD ABORTION & TARGET UNTOUCHED
  // ------------------------------------------------------------------------
  console.log('--- 1. INVALID SCHEMA PAYLOAD REJECTION ---');
  const dir1 = createTempDir('blueprint-fi-1');
  try {
    const targetPath1 = path.join(dir1, 'target.json');
    const tempPath1 = path.join(dir1, 'target.json.tmp');
    fs.writeFileSync(targetPath1, JSON.stringify(pristineSnapshot, null, 2), 'utf8');
    const originalHash1 = getFileHash(targetPath1);

    const collector1 = new GitHubCollector({
      targetPath: targetPath1,
      tempPath: tempPath1,
      schemaPath: schemaPath
    });

    // Create mutated invalid payload (missing required login, invalid access_mode, negative stars)
    const invalidPayload = JSON.parse(JSON.stringify(pristineSnapshot));
    delete invalidPayload.user.login;
    invalidPayload.provenance.access_mode = 'UNAUTHORIZED_MODE';
    invalidPayload.telemetry.total_stars = -5;

    let errorThrown = false;
    let errorMessage = '';

    try {
      collector1.validatePayloadSchema(invalidPayload);
    } catch (err) {
      errorThrown = true;
      errorMessage = err.message;
    }

    const tmpNeverCreated = !fs.existsSync(tempPath1);
    const targetUntouched = getFileHash(targetPath1) === originalHash1;
    const test1Pass = errorThrown && errorMessage.includes('[SCHEMA VALIDATION FAILED]') && tmpNeverCreated && targetUntouched;

    record('FI-01', 'Invalid Schema Payload Aborts Before Write', test1Pass, `Rejected: ${errorThrown}, .tmp created: ${!tmpNeverCreated}, Target preserved: ${targetUntouched}`);
  } finally {
    cleanTempDir(dir1);
  }

  // ------------------------------------------------------------------------
  // TEST 2: TEMPORARY FILE WRITE FAILURE SAFETY
  // ------------------------------------------------------------------------
  console.log('\n--- 2. TEMPORARY FILE WRITE FAILURE SAFETY ---');
  const dir2 = createTempDir('blueprint-fi-2');
  try {
    const targetPath2 = path.join(dir2, 'target.json');
    // Point tempPath to an illegal path (e.g. inside a file treated as a directory)
    const barrierFile = path.join(dir2, 'barrier-file');
    fs.writeFileSync(barrierFile, 'not-a-directory', 'utf8');
    const tempPath2 = path.join(barrierFile, 'sub-dir/target.json.tmp');

    fs.writeFileSync(targetPath2, JSON.stringify(pristineSnapshot, null, 2), 'utf8');
    const originalHash2 = getFileHash(targetPath2);

    const collector2 = new GitHubCollector({
      targetPath: targetPath2,
      tempPath: tempPath2,
      schemaPath: schemaPath
    });

    let writeFailed = false;
    try {
      collector2.writeAtomicSnapshot(pristineSnapshot);
    } catch (err) {
      writeFailed = true;
    }

    const targetPreserved2 = getFileHash(targetPath2) === originalHash2;
    const test2Pass = writeFailed && targetPreserved2;

    record('FI-02', 'Temporary File Write Failure Preserves Existing Target', test2Pass, `Write failed safely: ${writeFailed}, Target preserved: ${targetPreserved2}`);
  } finally {
    cleanTempDir(dir2);
  }

  // ------------------------------------------------------------------------
  // TEST 3 & 4: ATOMIC RENAME FAILURE & GUARANTEED CLEANUP
  // ------------------------------------------------------------------------
  console.log('\n--- 3 & 4. ATOMIC RENAME FAILURE & GUARANTEED CLEANUP ---');
  const dir3 = createTempDir('blueprint-fi-3');
  try {
    // In POSIX, renaming a file over an existing DIRECTORY throws EISDIR/EPERM
    const targetDirCollision = path.join(dir3, 'target-collision');
    fs.mkdirSync(targetDirCollision); // targetPath is a directory!
    const tempPath3 = path.join(dir3, 'target.json.tmp');

    const collector3 = new GitHubCollector({
      targetPath: targetDirCollision,
      tempPath: tempPath3,
      schemaPath: schemaPath
    });

    let renameFailed = false;
    let caughtError = null;

    try {
      collector3.writeAtomicSnapshot(pristineSnapshot);
    } catch (err) {
      renameFailed = true;
      caughtError = err;
    }

    const tmpWasCleanedUp = !fs.existsSync(tempPath3);
    const test3Pass = renameFailed && caughtError !== null;
    const test4Pass = tmpWasCleanedUp;

    record('FI-03', 'Atomic Rename Failure Caught & Error Propagated', test3Pass, `Rename failed: ${renameFailed}, Error: ${caughtError ? caughtError.code || caughtError.message : 'none'}`);
    record('FI-04', 'Temporary File Cleaned Up In Finally Block After Rename Failure', test4Pass, `Orphan .tmp exists: ${!tmpWasCleanedUp}`);
  } finally {
    cleanTempDir(dir3);
  }

  // ------------------------------------------------------------------------
  // TEST 5: PRESERVATION OF PREVIOUS VALID SNAPSHOT UNDER MULTIPLE FAILURES
  // ------------------------------------------------------------------------
  console.log('\n--- 5. PRESERVATION OF VALID SNAPSHOT UNDER MULTIPLE FAILURES ---');
  const dir5 = createTempDir('blueprint-fi-5');
  try {
    const targetPath5 = path.join(dir5, 'target.json');
    const tempPath5 = path.join(dir5, 'target.json.tmp');
    fs.writeFileSync(targetPath5, JSON.stringify(pristineSnapshot, null, 2), 'utf8');
    const originalHash5 = getFileHash(targetPath5);

    const collector5 = new GitHubCollector({
      targetPath: targetPath5,
      tempPath: tempPath5,
      schemaPath: schemaPath
    });

    // 1. Fail with invalid schema
    const bad = JSON.parse(JSON.stringify(pristineSnapshot));
    bad.provenance = null;
    try { collector5.validatePayloadSchema(bad); } catch (e) {}

    // 2. Fail with missing required fields
    const bad2 = JSON.parse(JSON.stringify(pristineSnapshot));
    bad2.historical_milestones = [];
    try {
      // Validate schema manually: required length min is not set, but missing log_id would fail
      bad2.historical_milestones = [{ invalid_key: true }];
      collector5.validatePayloadSchema(bad2);
    } catch (e) {}

    const finalHash5 = getFileHash(targetPath5);
    const test5Pass = originalHash5 === finalHash5 && !fs.existsSync(tempPath5);

    record('FI-05', 'Valid Snapshot Preserved 100% Uncorrupted Across Injected Failures', test5Pass, `Hash match: ${originalHash5 === finalHash5}, No orphan tmp: ${!fs.existsSync(tempPath5)}`);
  } finally {
    cleanTempDir(dir5);
  }

  // ------------------------------------------------------------------------
  // TEST 6: SUCCESSFUL SCHEMA VALIDATION & ATOMIC REPLACEMENT
  // ------------------------------------------------------------------------
  console.log('\n--- 6. SUCCESSFUL VALIDATION & ATOMIC REPLACEMENT ---');
  const dir6 = createTempDir('blueprint-fi-6');
  try {
    const targetPath6 = path.join(dir6, 'target.json');
    const tempPath6 = path.join(dir6, 'target.json.tmp');

    // Initial baseline
    const initialContent = { ...pristineSnapshot, initial: true };
    fs.writeFileSync(targetPath6, JSON.stringify(initialContent, null, 2), 'utf8');

    const collector6 = new GitHubCollector({
      targetPath: targetPath6,
      tempPath: tempPath6,
      schemaPath: schemaPath
    });

    // Valid update payload
    const updatedPayload = JSON.parse(JSON.stringify(pristineSnapshot));
    updatedPayload.telemetry.total_stars = 3; // Valid increment

    const schemaValid = collector6.validatePayloadSchema(updatedPayload);
    collector6.writeAtomicSnapshot(updatedPayload);

    const targetExists = fs.existsSync(targetPath6);
    const tmpGone = !fs.existsSync(tempPath6);
    const readBack = JSON.parse(fs.readFileSync(targetPath6, 'utf8'));
    const contentUpdated = readBack.telemetry.total_stars === 3;

    const test6Pass = schemaValid && targetExists && tmpGone && contentUpdated;
    record('FI-06', 'Successful Validation & Atomic Replacement Flow', test6Pass, `Validated: ${schemaValid}, Updated: ${contentUpdated}, .tmp unlinked: ${tmpGone}`);
  } finally {
    cleanTempDir(dir6);
  }

  // ------------------------------------------------------------------------
  // TEST 7: CRITICAL SCHEMA BYPASS PREVENTION
  // ------------------------------------------------------------------------
  console.log('\n--- 7. SCHEMA BYPASS PREVENTION ---');
  const collector7 = new GitHubCollector({
    schemaPath: '/path/to/non-existent-schema.json'
  });

  let bypassPrevented = false;
  try {
    collector7.validatePayloadSchema(pristineSnapshot);
  } catch (err) {
    bypassPrevented = err.message.includes('[SCHEMA CRITICAL]');
  }
  record('FI-07', 'Missing Schema Throws Critical Abort (No Silent Bypass)', bypassPrevented, `Aborted on missing schema: ${bypassPrevented}`);

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n================================================================');
  console.log(`=== FAILURE-INJECTION SUMMARY: ${passed} / ${total} TESTS PASSED (${failed} FAILS) ===`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runHardeningTests();
