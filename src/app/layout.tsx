import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DebtProvider } from '@/context/DebtContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DebtZero | Intelligent Debt Elimination & Payoff Engine',
  description:
    'Eliminate credit cards, student loans, auto loans, and mortgages in the fastest, most cost-effective way possible using algorithmic Debt Avalanche, Snowball, and Windfall lump-sum allocation.',
  keywords: [
    'debt elimination',
    'debt avalanche calculator',
    'debt snowball',
    'windfall bonus allocator',
    'credit card payoff schedule',
    'amortization calculator',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#060913] dark:text-slate-100 transition-colors">
        <DebtProvider>{children}</DebtProvider>
      </body>
    </html>
  );
}
