'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, Trophy, Gamepad2, User } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/live', label: 'Live', icon: PlayCircle },
    { href: '/sports/football', label: 'Sports', icon: Trophy },
    { href: '/casino', label: 'Casino', icon: Gamepad2 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 border-t border-gray-800 lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
                  active 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1.5 ${active ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-xs ${active ? 'text-green-500' : 'text-gray-400'}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}






