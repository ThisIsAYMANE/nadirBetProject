'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Globe, ChevronUp, Shield } from 'lucide-react';

/** Link columns for footer – filled with real routes */
const FOOTER_LINKS = {
  sports: {
    title: 'Sports',
    links: [
      { label: 'Pre-match', href: '/sports' },
      { label: 'Live Betting', href: '/live' },
      { label: 'Football', href: '/sports?category=football' },
      { label: 'Basketball', href: '/sports?category=basketball' },
      { label: 'Tennis', href: '/sports?category=tennis' },
      { label: 'All Sports', href: '/sports' },
    ],
  },
  casino: {
    title: 'Casino',
    links: [
      { label: 'Slots', href: '/casino' },
      { label: 'Live Casino', href: '/casino' },
      { label: 'Table Games', href: '/casino' },
      { label: 'New Games', href: '/casino' },
      { label: 'Promotions', href: '/casino' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Responsible Gaming', href: '/responsible-gaming' },
      { label: 'Account', href: '/profile' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Licenses', href: '/licenses' },
      { label: 'Rules', href: '/rules' },
    ],
  },
};

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    ariaLabel: 'Follow us on Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bgClass: 'bg-[#1877F2] hover:bg-[#166FE5]',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    ariaLabel: 'Follow us on Instagram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    bgClass: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] hover:opacity-90',
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    ariaLabel: 'Subscribe on YouTube',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    bgClass: 'bg-[#FF0000] hover:bg-[#cc0000]',
  },
];

const CASINO_PROVIDERS = [
  'Pragmatic Play',
  'NetEnt',
  'Evolution',
  'Microgaming',
  'Play\'n GO',
  'Red Tiger',
  'EGT',
  'Yggdrasil',
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto lg:ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Logo, Social & Language */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/freebet.png"
              alt="Freebet"
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <div>
              <span className="text-base sm:text-lg font-bold text-white block">Freebet</span>
              <span className="text-xs text-gray-400">Casino & Sports Betting</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {SOCIAL_LINKS.map(({ name, href, ariaLabel, icon, bgClass }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-white transition-all hover:scale-105 active:scale-95 ${bgClass}`}
                >
                  {icon}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 text-gray-400 border-l border-gray-700 pl-4">
              <Globe className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">ENG</span>
              <button type="button" className="text-sm hover:text-white transition-colors" aria-label="Change language">
                Language
              </button>
            </div>
          </div>
        </div>

        {/* Link columns – Sports, Casino, Support, Legal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {Object.entries(FOOTER_LINKS).map(([key, { title, links }]) => (
            <div key={key}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={`${key}-${label}`}>
                    <Link
                      href={href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Regulations & Partners */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Regulations & Partners
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 p-4 sm:p-5 rounded-xl bg-gray-800/60 border border-gray-700/50">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center overflow-hidden">
                <Image src="/freebet.png" alt="" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Freebet</span>
                <span className="text-xs text-gray-400">Casino & Sports Betting</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 leading-relaxed">
                Licensed and regulated. This service is operated under applicable regulations. By using our platform you agree to our General Terms and Conditions. We may update these terms from time to time; please check this page for the latest version.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600/50">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-[10px] sm:text-xs font-medium text-green-400 uppercase tracking-wide">Licensed</span>
            </div>
          </div>
        </section>

        {/* Gaming Providers */}
        <section className="mb-8">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Gaming Providers
          </h3>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 sm:gap-3 min-w-max pb-2">
              {CASINO_PROVIDERS.map((provider) => (
                <span
                  key={provider}
                  className="shrink-0 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300 hover:border-green-500/50 hover:text-white transition-colors whitespace-nowrap"
                >
                  {provider}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom: Quick links, Scroll to top, Copyright */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-800">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer navigation">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/sports" className="text-gray-400 hover:text-white transition-colors">
              Sports
            </Link>
            <Link href="/live" className="text-gray-400 hover:text-white transition-colors">
              Live
            </Link>
            <Link href="/casino" className="text-gray-400 hover:text-white transition-colors">
              Casino
            </Link>
            <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
              Profile
            </Link>
            <Link href="/favorites" className="text-gray-400 hover:text-white transition-colors">
              Favorites
            </Link>
          </nav>
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors shrink-0"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Freebet. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
