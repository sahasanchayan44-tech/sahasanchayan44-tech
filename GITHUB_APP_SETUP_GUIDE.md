# BLUEPRINT // FORGE RUNTIME
# GITHUB APP SETUP & CONFIGURATION GUIDE FOR AUTOMATED TELEMETRY

**Target Repository:** [sahasanchayan44-tech/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech)
**Document ID:** `SAHA-BP-PHASE12-APP-GUIDE-REV01`
**Purpose:** Instructions for provisioning a dedicated GitHub App to enable automated, pull-request-driven daily telemetry synchronization under strict branch protection without Personal Access Tokens or repository-wide bypasses.

---

## 1. Architectural Rationale

In Phase 12.1, pre-enforcement testing determined that GitHub Repository Rulesets do not support per-workflow or path-scoped bypasses (`"Workflow is not a valid actor type"`).

Under strict branch protection, direct pushes to `main` are blocked. To allow automated daily synchronization without weakening security:
1. Telemetry updates are pushed to a disposable automation branch (`automation/telemetry-sync`).
2. A pull request is created targeting `main`.
3. The pull request triggers all four required CI checks (`validate`, `accessibility`, `security`, `test`).
4. Upon passing all checks, the PR is automatically merged into `main` via GitHub's native auto-merge engine.

### Why a Dedicated GitHub App is Required
- **Triggering CI:** Commits and PRs created by the standard `GITHUB_TOKEN` do not trigger GitHub Actions workflows (preventing recursive loops). A GitHub App installation token **does** trigger workflow events, enabling the CI pipeline to validate telemetry PRs before merging.
- **Zero-Bypass Architecture:** The GitHub App does **not** bypass branch protection. It is subject to the exact same CI validation rules as human maintainers.
- **Credential Hygiene:** Avoids personal access tokens (PATs) tied to user accounts. Installation tokens are generated dynamically at runtime and expire within 60 minutes.

---

## 2. Step-by-Step GitHub App Creation Guide

Execute the following steps in your GitHub account (`sahasanchayan44-tech`):

### Step 1: Open GitHub App Registration
1. Navigate to: **GitHub Profile (top right) -> Settings -> Developer Settings -> GitHub Apps**.
   - Direct URL: [https://github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Enter the **GitHub App name**:
   ```
   blueprint-telemetry-bot
   ```
   *(If this name is already taken globally on GitHub, use `blueprint-telemetry-sahasanchayan44`)*.
3. Enter the **Homepage URL**:
   ```
   https://sahasanchayan44-tech.github.io/sahasanchayan44-tech/
   ```
4. **Webhook**:
   - Uncheck the **Active** checkbox under the Webhook section (no webhook server or URL is needed).

### Step 2: Configure App Permissions
Scroll to the **Permissions** section and configure repository permissions:

| Permission Category | Scope | Access Level | Purpose |
| :--- | :--- | :--- | :--- |
| **Repository: Contents** | `contents` | **Read and write** | To checkout `origin/main` and push to `automation/telemetry-sync` |
| **Repository: Pull requests** | `pull-requests` | **Read and write** | To open, update, and enable auto-merge on telemetry PRs |
| **Repository: Metadata** | `metadata` | **Read-only** | Required default permission to access repository metadata |

*(Ensure all other permissions remain set to "No access")*.

### Step 3: Where can this GitHub App be installed?
Select:
- **Only on this account** (`sahasanchayan44-tech`).

Click **Create GitHub App**.

---

## 3. Generate Private Key & Install the App

### Step 4: Generate a Private Key
1. After creation, scroll to the **Private keys** section at the bottom of the App's **General** settings page.
2. Click **Generate a private key**.
3. A `.pem` file will automatically download to your computer (e.g. `blueprint-telemetry-bot.2026-11-09.private-key.pem`).
4. Note your numeric **App ID** displayed near the top of the **General** settings page (e.g., `1234567`).

### Step 5: Install the App on the Repository
1. In the left navigation sidebar of the App page, click **Install App**.
2. Click the **Install** button next to account `sahasanchayan44-tech`.
3. Under **Repository access**, select:
   - **Only select repositories** -> Select `sahasanchayan44-tech/sahasanchayan44-tech`.
4. Click **Install**.

---

## 4. Configure Repository Secrets & Settings

### Step 6: Add GitHub Actions Repository Secrets
1. Navigate to your repository settings:
   - Direct URL: [https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings/secrets/actions](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings/secrets/actions)
2. Click **New repository secret**:
   - **Name:** `TELEMETRY_APP_ID`
   - **Secret:** Enter your numeric App ID from Step 4 (e.g., `1234567`).
   - Click **Add secret**.
3. Click **New repository secret**:
   - **Name:** `TELEMETRY_APP_PRIVATE_KEY`
   - **Secret:** Open the downloaded `.pem` file in a text editor, copy its entire contents including:
     ```text
     -----BEGIN RSA PRIVATE KEY-----
     ...
     -----END RSA PRIVATE KEY-----
     ```
   - Paste the complete key into the secret box and click **Add secret**.

### Step 7: Enable Repository Auto-Merge
1. Navigate to repository **Settings -> General**:
   - Direct URL: [https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings)
2. Scroll to the **Pull Requests** section.
3. Check the box: **Allow auto-merge**.
4. Check the box: **Automatically delete head branches** (optional, recommended).
5. Ensure **Allow squash merging** is enabled.

---

## 5. Enable Main Branch Protection Ruleset

Once Steps 1 through 7 are complete and verified, enable the approved Ruleset on `main`:

1. Navigate to: **Settings -> Rules -> Rulesets -> New ruleset -> New branch ruleset**.
   - Direct URL: [https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings/rules](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/settings/rules)
2. **Ruleset Name:** `Main Branch Operational Safeguards`
3. **Enforcement status:** Set to `Active`.
4. **Bypass list:** Leave completely **empty** (zero bypasses).
5. **Target branches:** Click **Add target** -> select **Default branch** (`main`).
6. **Branch Rules to Enable:**
   - [x] **Restrict deletions**
   - [x] **Block force pushes**
   - [x] **Require a pull request before merging**:
     - Required approving reviews: `0` (solo-maintainer compatibility)
     - Require conversation resolution: `Checked`
   - [x] **Require status checks to pass**:
     - `Codebase & Document Validation`
     - `Accessibility & Usability Audit`
     - `Security & Credential Hygiene`
     - `Regression & Browser Test Suites`
     *(Do NOT select `Production Deployment Verification` as it executes post-merge)*.
7. Click **Create** or **Save changes**.

---

## 6. Verification & Health Monitoring

To verify the complete lifecycle once configured:
1. Navigate to **Actions -> Daily GitHub Telemetry Synchronization**.
2. Click **Run workflow** (select `force_update: true` to trigger an update cycle).
3. Observe workflow execution:
   - Data collected and validated against Draft-07 schema.
   - Pushes to branch `automation/telemetry-sync`.
   - Opens Pull Request targeting `main`.
   - Auto-merge enabled on the PR.
   - PR triggers the CI workflow (`Continuous Integration & Delivery`).
   - All 4 required checks pass green.
   - GitHub automatically merges the PR into `main`.
   - Deployment verification verifies live production parity post-merge.
