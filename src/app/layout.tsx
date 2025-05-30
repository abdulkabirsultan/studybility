import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ui/toast';
import ToastInitializer from '@/components/ToastInitializer';
import Header from '@/components/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StudyBility - AI Study Buddy Learning Support for Students',
  description:
    'An accessible AI-powered study companion designed specifically for students with learning disabilities. Features include speech-to-text, text-to-speech, customizable fonts, and adaptive learning support.',
  keywords: [
    'AI',
    'study buddy',
    'learning disabilities',
    'accessibility',
    'education',
    'speech recognition',
  ],
  authors: [{ name: 'Adewoyin Abdulkabir Sultan' }],
  openGraph: {
    title: 'StudyBility - AI Study Buddy Learning Support for Students',
    description:
      'An accessible AI-powered study companion designed specifically for students with learning disabilities.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyBility - AI Study Buddy Learning Support for Students',
    description:
      'An accessible AI-powered study companion designed specifically for students with learning disabilities.',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='scroll-smooth' suppressHydrationWarning>
      <head>
        <meta name='color-scheme' content='light dark' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <div className='flex flex-col h-screen overflow-hidden'>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              <ToastInitializer />
              <Header />
              <main className='flex-1 overflow-hidden'>{children}</main>
            </ToastProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
