import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { DebtProvider } from '@/context/DebtContext';

const geistSans = localFont({
  src: '../fonts/geist-latin.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  display: 'swap',
});

const geistMono = localFont({
  src: '../fonts/geist-mono-latin.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
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

// GitHub Pages cannot send response headers, so the policy ships as a meta tag. The static export
// inlines its bootstrap scripts and Recharts sets inline styles, hence 'unsafe-inline'. Dev mode is
// skipped because HMR needs eval and websockets.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {process.env.NODE_ENV === 'production' && (
          <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-[#fbf9f4] text-slate-800 transition-colors selection:bg-amber-200 selection:text-amber-900">
        <DebtProvider>{children}</DebtProvider>
      </body>
    </html>
  );
}
