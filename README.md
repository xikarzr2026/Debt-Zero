# 🚀 DebtZero: Intelligent Debt Elimination & Payoff Engine

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://xikarzr2026.github.io/Debt-Zero/)
[![Version](https://img.shields.io/badge/Version-1.0.0-emerald?style=for-the-badge)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **DebtZero** is a modern, privacy-focused financial web application that computes optimal debt repayment trajectories, simulates payoff strategies, and visualizes interest savings to help you become debt-free faster.

🔗 **Live Application URL**: [https://xikarzr2026.github.io/Debt-Zero/](https://xikarzr2026.github.io/Debt-Zero/)

---

## 📸 Key Features

### 1. ⚡ Multi-Strategy Optimization Algorithms
- **Debt Avalanche (Mathematical Optimum)**: Prioritizes debts with the highest Annual Percentage Rate (APR). Minimizes total interest paid and saves the most money overall.
- **Debt Snowball (Psychological Momentum)**: Prioritizes debts with the smallest balances first to generate rapid milestone wins and build financial momentum.
- **Custom Priority**: Manually rank debts based on personal goals or emotional priorities.
- **Minimums-Only Benchmark**: Automatically compares your accelerated strategy against standard minimum payments to highlight total interest and time saved.

### 2. 📊 Interactive Payoff Timeline & Projection
- Dynamic multi-year trajectory visualization showing aggregate balance decline over time.
- Direct side-by-side comparison between **Avalanche**, **Snowball**, and **Minimum Payments Only**.
- Clear timeline metrics showing exact debt-free dates and lifetime interest accrued.

### 3. 💵 Cash Flow & Budget Engine
- Configurable net income engine supporting monthly, bi-weekly, semi-monthly, and weekly pay periods.
- Itemized essential living expenses breakdown (housing, utilities, groceries, transportation, insurance, subscriptions).
- Automatically calculates monthly discretionary surplus available for extra debt acceleration.

### 4. 🗓️ Monthly Payment Checklist & Due Date Tracker
- Interactive month-by-month payment checklist with individual debt due dates.
- Clear split between contractual minimum payments and allocated surplus extra principal.
- One-click status toggling (`Paid` / `Pending`) to keep daily financial execution organized.

### 5. 🔮 "What-If" Windfall & Acceleration Simulator
- Real-time simulation of one-time lump-sum windfalls (tax refunds, work bonuses, asset sales) or recurring monthly budget boosts.
- Instant feedback showing exact months shaved off your payoff journey and total interest spared.

### 6. 📋 Detailed Month-by-Month Amortization Schedule
- Complete granular ledger detailing starting balances, monthly interest accrued, principal reduction, and ending balances for every single debt.
- Searchable by debt name, paginated for performance, and structured for clarity.

### 7. 🌍 Multi-Currency & Locale Support
- Supports instant switching across major global currencies:
  - **USD** ($)
  - **EUR** (€)
  - **GBP** (£)
  - **CAD** (CA$)
  - **AUD** (A$)
  - **JPY** (¥)
  - **MXN** (MX$)

---

## 🔒 Data Storage & Privacy: Where Does Your Info Go?

> **Short Answer**: Nowhere. **100% of your data stays strictly on your personal device.**

- **Zero Remote Servers or Databases**: DebtZero does not operate any backend database, cloud sync, or external tracking servers. None of your debts, balances, interest rates, income, or personal numbers are ever transmitted over the network.
- **Client-Side `localStorage` Only**: All financial records, custom payoff settings, and checklists are saved exclusively in your browser's private `localStorage` sandbox (`debtzero_userdata_v1`).
- **No Accounts or Bank Linking**: You never have to sign up, enter an email, connect a bank account, or provide personal credentials.
- **Full Portability & Backups**: You can export an offline `.json` file of your complete financial plan at any time and import it on any other machine or browser via the **Backup & Restore** button in the header.
- **Data Removal**: Clearing your browser's site data/cache or closing a private/incognito browsing window will instantly wipe all stored data from your device.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Static HTML Export)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Tailwind CSS & Modern Glassmorphic Design System
- **CI/CD & Hosting**: [GitHub Actions](https://github.com/features/actions) + [GitHub Pages](https://pages.github.com/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/), `pnpm`, or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:xikarzr2026/Debt-Zero.git
   cd Debt-Zero
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Automated Mathematical Verification & Test Suite

DebtZero includes an automated mathematical verification suite that rigorously tests all financial calculations, amortization schedules, negative amortization detectors, and strategy sorting algorithms:

```bash
npm test
```

### Verified Mathematical Modules:
- **Monthly Compounding Interest**: Exact precision rounding to the cent (`balance * (apr / 100 / 12)`).
- **Pay Frequency Normalization**: Accurate conversion across weekly, bi-weekly, semi-monthly, and monthly paychecks.
- **Free Cash Flow & DTI**: Accurate surplus determination excluding retired/zero-balance liabilities.
- **Negative Amortization Alerting**: Automatic warning when contractual minimums do not cover monthly interest accrual.
- **Accounting Invariant Identity**: Proves `Ending Balance = Starting Balance + Interest Charged - Total Payments` across every month.
- **Multi-Strategy Optimization**: Proves Debt Avalanche produces minimal lifetime interest and Snowball accelerates initial debt eliminations.
- **Windfall Acceleration**: Verifies interest and months saved under one-time and recurring lump-sum simulations.

---

## 📦 Production Build & Deployment

To create a static production build exported to the `/out` directory:

```bash
npm run build
```

### GitHub Pages Deployment
This repository is pre-configured with automated GitHub Actions continuous deployment (`.github/workflows/deploy.yml`). Any push to the `main` branch automatically:
1. Installs clean dependencies (`npm ci`).
2. Generates the static export bundle (`npm run build`).
3. Uploads the build artifact and deploys directly to GitHub Pages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
