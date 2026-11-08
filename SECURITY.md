# Security Policy

## 1. Supported Versions

BLUEPRINT provides security updates for the following release branches:

| Version | Supported | Status |
| :--- | :---: | :--- |
| **v1.0.x** | **Yes** | Active production release line (v1.0.0 baseline + telemetry automation) |
| **< v1.0.0** | **No** | Historical pre-release specifications and development snapshots |

---

## 2. Reporting a Vulnerability

The BLUEPRINT project takes security and data integrity seriously. If you identify a potential security vulnerability, privacy issue, or unauthorized information disclosure, please report it responsibly.

### Preferred Reporting Channel: GitHub Private Vulnerability Reporting
Please submit all vulnerability reports privately using GitHub's built-in **Private Vulnerability Reporting** feature:

1. Navigate to the repository's **Security** tab:
   [https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/security](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/security)
2. Under "Vulnerability disclosure", click **Report a vulnerability**:
   [https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/security/advisories/new](https://github.com/sahasanchayan44-tech/sahasanchayan44-tech/security/advisories/new)
3. Fill out the report form and click **Submit report**.

Alternatively, if private advisory submission is unavailable, contact the project maintainer directly via GitHub profile channels:

[https://github.com/sahasanchayan44-tech](https://github.com/sahasanchayan44-tech)

> **Important**: Please do **not** open public GitHub issues, discussions, or pull requests to disclose unpatched security vulnerabilities or privacy concerns.

---

## 3. Information to Include in Your Report

To help us investigate and triage the issue effectively, please include as much of the following information as possible:

- **Type of Issue**: Brief classification (e.g., cross-site scripting, data sanitization failure, sensitive information exposure, CI/CD pipeline vulnerability).
- **Affected Components**: Specific sheets, scripts, stylesheets, or workflows involved.
- **Steps to Reproduce**: Clear, reproducible step-by-step instructions or minimal test case.
- **Impact Assessment**: The potential severity, affected user populations, or compromised assets.
- **Proposed Mitigation**: A patch or remediation recommendation, if you have one available.

---

## 4. How Reports Are Handled

1. **Triage**: The maintainer will review the vulnerability report to confirm the behavior and determine its severity.
2. **Investigation & Patching**: Remediation is developed and validated within a private environment or advisory branch.
3. **Verification**: Automated regression suites and audit harnesses verify the fix without disrupting existing architectural invariants.
4. **Release & Disclosure**: The fix is deployed to `main`, published to GitHub Pages, and documented in release notes. Public credit will be given to the reporter if desired.

---

## 5. Security & Privacy Invariants

BLUEPRINT enforces the following built-in security practices:

- **Zero-Email Exposure**: The repository strictly prevents the publication of personal email addresses in source code, committed assets, or public telemetry snapshots.
- **Unauthenticated Public REST Access**: Automated telemetry collection operates strictly on public unauthenticated endpoints with zero token dependency.
- **Restricted CI/CD Permissions**: GitHub Actions workflows utilize minimal required privileges (`contents: write`) with concurrency locks to prevent race conditions.
