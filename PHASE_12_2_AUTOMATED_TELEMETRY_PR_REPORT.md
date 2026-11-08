# BLUEPRINT // FORGE RUNTIME
# PHASE 12.2: AUTOMATED TELEMETRY PULL REQUESTS & PROTECTED MAIN ARCHITECTURE REPORT

**Document ID:** `SAHA-BP-PHASE12-2-REPORT-REV01`
**Date:** 2026-11-09
**Repository:** [sahasanchayan44-tech/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech)
**Workspace:** `~/Projects/BLUEPRINT`
**Production URL:** [https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/](https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/)
**Baseline Commit:** `58651966eb8f4a603e84bf96010b2222dd203bb4`
**Production Release Tag:** `v1.0.0` (`54e98ee0c97b7e728b375f38b5b3ea35a7606f9f` — IMMUTABLE)

---

## 1. Executive Summary & Verdict

Phase 12.2 transitions the daily GitHub telemetry synchronization architecture from a direct-to-main push mechanism to a secure, automated pull-request lifecycle. This transition addresses the critical constraint identified during Phase 12.1: GitHub Repository Rulesets cannot grant path-level or workflow-level bypasses (`"Workflow is not a valid actor type"`). Under strict branch protection on `main`, automated synchronization cannot commit directly to `main` without broad bypasses that would compromise repository security.

By refactoring the synchronization engine to operate via a dedicated GitHub App installation token, automated updates are submitted as Pull Requests on an isolated branch (`automation/telemetry-sync`). Each PR automatically triggers the complete 4-job CI test suite. Once all required CI checks pass, GitHub's native auto-merge engine squashes and merges the telemetry payload into `main`, triggering post-merge production deployment verification.

### Status Table

| Architecture Component | Status | Operational Detail |
| :--- | :--- | :--- |
| **Telemetry Workflow Refactoring** | `VERIFIED` | Direct pushes to `main` removed; PR creation and auto-merge implemented. |
| **Telemetry Test Suite Validation** | `VERIFIED` | 12/12 tests passing with updated permissions assertions (`contents: write`, `pull-requests: write`). |
| **Local Codebase Validation** | `VERIFIED` | 19/19 checks passing across structure, documentation, and formatting. |
| **Local Security & Credential Audit** | `VERIFIED` | 4/4 checks passing (201 files scanned, 0 secrets, 0 personal emails). |
| **Pre-Merge PR CI Pipeline** | `VERIFIED` | Validated in PR #4 (run `42522178515`): 4 required checks passed in 1m 01s; deployment verification skipped. |
| **Production Deployment & Integrity** | `VERIFIED` | Production site live (HTTP 200); JSON schema valid; SHA-256 parity confirmed. |
| **GitHub App Credentials** | `PENDING OWNER ACTION` | `gh secret list` confirms zero repository secrets. Credentials must be created by owner. |
| **Repository Auto-Merge Enablement** | `PENDING OWNER ACTION` | `allow_auto_merge` is `false` in repo settings. Requires owner activation in UI. |
| **Main Branch Ruleset Enforcement** | `NOT CONFIGURED` | Ruleset prepared with zero bypasses; intentionally left disabled pending owner credential setup. |

---

## 2. Architecture & Design

### 2.1 The Automated PR Lifecycle

The automated telemetry architecture replaces direct-to-main commits with a closed-loop validation pipeline:

```mermaid
flowchart TD
    A["Daily Cron (02:17 UTC) / workflow_dispatch"] --> B["Checkout repository"]
    B --> C["Generate Telemetry (fetch-public-github-data.js)"]
    C --> D["Schema Validation (Draft-07)"]
    D --> E{"Substantive Change Detected?"}
    E -- No --> F["Exit 0 (No PR opened)"]
    E -- Yes --> G{"GitHub App Secrets Present?"}
    G -- No --> H["Warn & Exit 0 (Graceful Degradation)"]
    G -- Yes --> I["Generate GitHub App Token"]
    I --> J["Push to automation/telemetry-sync"]
    J --> K["Open / Update PR targeting main"]
    K --> L["Enable Auto-Merge (gh pr merge --auto --squash)"]
    L --> M["PR Triggers CI Pipeline (ci.yml)"]
    M --> N["Run 4 Required Checks (validate, access, sec, test)"]
    N -- Checks Pass --> O["GitHub Native Auto-Merge Squashes into main"]
    O --> P["Post-Merge CI Triggers verify-deployment"]
    N -- Checks Fail --> Q["PR Left Open for Owner Investigation"]
```

### 2.2 Invariants Maintained
1. **Zero-Bypass Security:** No user, app, or workflow is granted bypass permissions on `main`. All code changes—automated or human—must pass the complete CI pipeline.
2. **Deterministic Schedule:** Daily execution at `17 2 * * *` UTC is preserved.
3. **Idempotency & Duplicate Prevention:** If a pull request for `automation/telemetry-sync` is already open, the workflow updates the existing branch and PR rather than opening duplicates.
4. **Substantive Change Gating:** If telemetry metrics (stars, forks, open issues, commit count) have not changed, no Git operations or PRs are triggered.

---

## 3. GitHub App Authentication Rationale

### 3.1 Limitation of Default GITHUB_TOKEN
When a GitHub Actions job uses the default `secrets.GITHUB_TOKEN` to push a branch or open a pull request, GitHub intentionally does **not** trigger downstream `pull_request` workflow runs. This prevents accidental infinite recursion loops. However, this restriction prevents `GITHUB_TOKEN`-created PRs from triggering the required CI status checks, making automated merging impossible under branch protection.

### 3.2 GitHub App Token Advantages
By authenticating using a dedicated GitHub App:
- **Triggers CI:** Actions performed by the GitHub App installation token generate authentic webhook events that trigger the `pull_request` workflow.
- **Short-Lived Credentials:** Tokens are generated dynamically in-memory via `actions/create-github-app-token@v1` and expire automatically within 60 minutes.
- **Principle of Least Privilege:** Permissions are restricted strictly to repository contents and pull requests.
- **No Personal Account Coupling:** Automation is decoupled from personal access tokens (PATs) and user lifecycle events.

---

## 4. Required Repository Permissions

The GitHub App requires the minimum viable permissions:

| Permission Category | Scope | Access Level | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Repository: Contents** | `contents` | **Read and write** | Required to fetch `main` and push updates to `automation/telemetry-sync`. |
| **Repository: Pull requests** | `pull-requests` | **Read and write** | Required to create PRs, update PR metadata, and toggle auto-merge. |
| **Repository: Metadata** | `metadata` | **Read-only** | Standard prerequisite for repository API access. |

All other scopes (Issues, Administration, Secrets, Workflows, Webhooks) remain **No access**.

---

## 5. Repository Secrets & Credential Safeguard

### 5.1 Required Secrets
The workflow expects two encrypted repository secrets:
1. `TELEMETRY_APP_ID`: Numeric application ID issued upon GitHub App creation.
2. `TELEMETRY_APP_PRIVATE_KEY`: RSA private key (`.pem`) generated for the App.

### 5.2 Current Audit Findings
Inspection via GitHub CLI:
```bash
$ gh secret list
no secrets found
```
Zero secrets are currently configured.

### 5.3 Safeguard Implementation
To prevent workflow crashes or noisy failures prior to owner setup, `.github/workflows/github-telemetry-sync.yml` includes an explicit credential detection step:
```yaml
      - name: Verify GitHub App credentials availability
        id: app_creds_check
        run: |
          if [ -z "${{ secrets.TELEMETRY_APP_ID }}" ] || [ -z "${{ secrets.TELEMETRY_APP_PRIVATE_KEY }}" ]; then
            echo "::warning title=Telemetry Automation Blocked::GitHub App credentials (TELEMETRY_APP_ID / TELEMETRY_APP_PRIVATE_KEY) are not configured. Cannot push pull request."
            echo "has_creds=false" >> "$GITHUB_OUTPUT"
          else
            echo "has_creds=true" >> "$GITHUB_OUTPUT"
          fi
```
Subsequent token generation and Git push steps are conditionally gated on `steps.app_creds_check.outputs.has_creds == 'true'`.

---

## 6. Telemetry Workflow Changes

### 6.1 Direct Push Removal
The direct push instruction (`git push origin main`) was completely eradicated from `.github/workflows/github-telemetry-sync.yml`.

### 6.2 Key Workflow Modifications
1. **Permissions Declaration:**
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```
2. **Dynamic Token Acquisition:**
   ```yaml
   - name: Generate GitHub App installation token
     if: steps.app_creds_check.outputs.has_creds == 'true'
     id: generate_token
     uses: actions/create-github-app-token@v1
     with:
       app-id: ${{ secrets.TELEMETRY_APP_ID }}
       private-key: ${{ secrets.TELEMETRY_APP_PRIVATE_KEY }}
   ```
3. **Automated Branch Push & PR Creation:**
   ```yaml
   - name: Push telemetry branch and manage pull request
     if: steps.app_creds_check.outputs.has_creds == 'true'
     env:
       GH_TOKEN: ${{ steps.generate_token.outputs.token }}
     run: |
       git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${{ github.repository }}.git"
       git push origin automation/telemetry-sync --force

       EXISTING_PR=$(gh pr list --head automation/telemetry-sync --base main --state open --json number -q '.[0].number')
       if [ -z "$EXISTING_PR" ]; then
         PR_URL=$(gh pr create --head automation/telemetry-sync --base main --title "chore(telemetry): daily public github metrics update" --body "$PR_BODY")
         PR_NUMBER=$(gh pr view automation/telemetry-sync --json number -q '.number')
       else
         PR_NUMBER="$EXISTING_PR"
       fi

       gh pr merge "$PR_NUMBER" --auto --squash --delete-branch
   ```

---

## 7. Branch Protection & Modern Ruleset Specification

### 7.1 Ruleset Configuration
The repository will be protected using a GitHub Repository Ruleset targeting the default branch `main`:

- **Ruleset Name:** `Main Branch Operational Safeguards`
- **Enforcement Status:** `Active` (after owner configuration)
- **Target:** `refs/heads/main`
- **Bypass List:** None (empty — zero bypasses)
- **Enforced Rules:**
  1. `Restrict deletions` — prevents deletion of `main`.
  2. `Block force pushes` — prevents rewriting Git history.
  3. `Require a pull request before merging`:
     - Approving reviews required: `0` (compatible with solo-maintainer).
     - Require conversation resolution: `Checked`.
  4. `Require status checks to pass before merging`:
     - `Codebase & Document Validation`
     - `Accessibility & Usability Audit`
     - `Security & Credential Hygiene`
     - `Regression & Browser Test Suites`
     *(Production Deployment Verification executes strictly post-merge)*.

### 7.2 Enforcement Precondition Safeguard
Branch protection enforcement remains **NOT CONFIGURED** at the remote repository level until the owner provisions the GitHub App and enables auto-merge. Enabling branch protection prematurely would block daily telemetry updates without an operational PR pathway.

---

## 8. Failure Recovery & Edge Case Handling

1. **Missing GitHub App Credentials:** Handled gracefully via `app_creds_check` step. Workflow outputs a descriptive warning and exits cleanly (exit code 0).
2. **Merge Conflicts:** If `main` advances with conflicting changes to `docs/data/github-data.json`, `git push --force` updates `automation/telemetry-sync`. If auto-merge cannot resolve conflicts, the PR remains open with status check warnings for human review.
3. **CI Test Failure on PR:** If any of the 4 required CI checks fail, GitHub auto-merge does not execute. The PR remains open, alerting the maintainer.
4. **Duplicate Runs:** Concurrency group `telemetry-sync-${{ github.ref }}` with `cancel-in-progress: true` prevents race conditions.

---

## 9. Rollback Instructions

If automated PR synchronization encounters unforeseen upstream issues, maintainers can rollback immediately:

1. **Disable Scheduled Workflow:**
   Navigate to **Actions -> Daily GitHub Telemetry Synchronization -> ... -> Disable workflow**.
2. **Delete Automation Branch:**
   ```bash
   git push origin --delete automation/telemetry-sync
   ```
3. **Revert Workflow Commit:**
   ```bash
   git revert HEAD -m 1
   git push origin main
   ```
4. **Manual Telemetry Refresh (Fallback):**
   ```bash
   node fetch-public-github-data.js
   git add docs/data/github-data.json
   git commit -m "chore(telemetry): manual update"
   git push origin main
   ```

---

## 10. End-to-End Acceptance Test Audit

| Acceptance Criterion | Verification Method | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **1. Telemetry Generation** | `node fetch-public-github-data.js` | `VERIFIED` | Generates 15 repositories, 12 languages, valid timestamp. |
| **2. Schema Validation** | `node tests/telemetry-sync-test.js` | `VERIFIED` | 12/12 test assertions pass including Draft-07 schema check. |
| **3. Automation Branch Creation** | Workflow script logic | `VERIFIED` | Branch creation and checkout validated; branch isolation confirmed. |
| **4. Pull Request Creation** | Workflow dry-run & PR #4 test | `PENDING OWNER ACTION` | Logic verified; awaiting GitHub App token generation in production. |
| **5. Four Required CI Checks** | PR #4 test run `42522178515` | `VERIFIED` | All 4 checks executed and passed in 1m 01s on PR event. |
| **6. Automatic Merge** | Workflow `gh pr merge --auto` | `PENDING OWNER ACTION` | Requires `allow_auto_merge: true` in repository settings. |
| **7. Main Branch Update** | GitHub auto-merge engine | `PENDING OWNER ACTION` | Dependent on steps 4 and 6. |
| **8. GitHub Pages Deployment** | Live HTTPS audit | `VERIFIED` | GitHub Pages active and healthy at production URL. |
| **9. Production Telemetry JSON** | HTTP GET inspection | `VERIFIED` | HTTP 200 OK, valid content-type, accurate metrics. |
| **10. SHA-256 Parity** | Hash comparison | `VERIFIED` | Local and production hashes confirmed in Phase 11 & 12 audits. |

---

## 11. Pending Owner Actions

To achieve full production operation:

1. **Register GitHub App:** Follow [GITHUB_APP_SETUP_GUIDE.md](file:///home/sanchayan/Projects/BLUEPRINT/GITHUB_APP_SETUP_GUIDE.md) Section 2 to create `blueprint-telemetry-bot`.
2. **Set Permissions:** Grant `Contents: Read and write`, `Pull requests: Read and write`, `Metadata: Read-only`.
3. **Generate & Download Private Key:** Download `.pem` file; note App ID.
4. **Install App:** Install on repository `sahasanchayan44-tech/sahasanchayan44-tech`.
5. **Add Secrets:** Configure `TELEMETRY_APP_ID` and `TELEMETRY_APP_PRIVATE_KEY` under repository Actions Secrets.
6. **Enable Auto-Merge:** Check "Allow auto-merge" in repository Settings -> General.
7. **Activate Branch Ruleset:** Create and activate `Main Branch Operational Safeguards` ruleset with zero bypasses.
8. **Execute Verification Run:** Trigger `Daily GitHub Telemetry Synchronization` with `force_update: true` and confirm automated PR squash-and-merge.

---

## 12. Final Acceptance Verdict

### Verdict: `PENDING OWNER ACTION`

The technical implementation of the automated pull request architecture, workflow refactoring, test suite updates, and comprehensive documentation is complete and locally verified. In strict adherence to engineering safety directives, branch protection enforcement on `main` remains disabled until the owner provisions the required GitHub App credentials and repository settings.
