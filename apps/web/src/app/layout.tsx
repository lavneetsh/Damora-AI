import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Damora AI — Private AI Workspace for Companies',
    template: '%s | Damora AI',
  },
  description:
    'Damora AI helps organizations centralize company knowledge, perform semantic search, and interact with internal documents through AI-powered conversations.',
  keywords: [
    'enterprise AI',
    'private AI workspace',
    'RAG',
    'knowledge base',
    'AI chat',
    'semantic search',
  ],
  authors: [{ name: 'Damora AI' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://damora.ai',
    siteName: 'Damora AI',
    title: 'Damora AI — Private AI Workspace for Companies',
    description:
      'Damora AI helps organizations centralize company knowledge, perform semantic search, and interact with internal documents through AI-powered conversations.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Damora AI — Private AI Workspace for Companies',
    description:
      'Damora AI helps organizations centralize company knowledge, perform semantic search, and interact with internal documents through AI-powered conversations.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#0f0f1a] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
