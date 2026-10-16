# Security Policy

## Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x (main branch) | :white_check_mark: |
| < 1.2   | :x:                |

---

## Reporting a Vulnerability

The DebtZero team takes the security and privacy of our users seriously. Because DebtZero operates as a 100% client-side application where all financial calculations and data remain in the user's local browser (`localStorage`), the security perimeter is focused on client-side safety, clean dependency trees, and export/import sanitization.

If you believe you have discovered a security vulnerability, please report it responsibly:

### Preferred Method: Private Vulnerability Reporting
Please report vulnerabilities privately through GitHub's **Private Vulnerability Reporting**:
1. Navigate to the [Security Advisories tab](https://github.com/xikarzr2026/Debt-Zero/security/advisories) on GitHub.
2. Click **"Report a vulnerability"**.
3. Provide details of the vulnerability, steps to reproduce, and potential impact.

### What to Expect:
- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Assessment**: We will evaluate the report, verify the issue, and provide periodic updates regarding a fix.
- **Public Disclosure**: Once a fix has been tested and deployed to the `main` branch, a public security advisory will be published with credit to the reporter (unless you request to remain anonymous).

Please **do not** report security vulnerabilities through public GitHub issues or discussions.

---

## Security Architecture & Best Practices

- **Zero Data Transmission**: DebtZero never sends user debt amounts, balances, APRs, income figures, or credentials to any remote server or third-party service.
- **Client-Side Only**: All math and amortization logic runs strictly in the user's browser.
- **Validated Input**: Imported backups and data read back from `localStorage` are size-limited, type-checked, and range-checked before use. CSV exports neutralise spreadsheet formulas.
- **Content Security Policy**: Production builds ship a restrictive CSP meta tag (no third-party origins, no plugins, no form submission).
- **Dependency Auditing**: GitHub CodeQL scans every push and pull request, and `npm audit` is reviewed when dependencies change. Dependabot version-update PRs are disabled.
- **Local Data Removal**: **Backup & Restore → Clear All Data** removes everything the app stored in the browser.
