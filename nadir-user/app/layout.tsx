import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import MobileNav from '@/components/layout/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freebet - Sports Betting & Casino',
  description: 'Professional sports betting platform with integrated casino',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={`${inter.className} bg-gray-900 text-white pb-14 lg:pb-0 overflow-x-hidden`}>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}