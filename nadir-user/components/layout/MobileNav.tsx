'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, PlayCircle, Trophy, Gamepad2, User, LogIn } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLoginClick = () => {
    // Trigger login modal by dispatching custom event
    window.dispatchEvent(new CustomEvent('openLoginModal'));
  };

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/live', label: 'Live', icon: PlayCircle },
    { href: '/sports/football', label: 'Sports', icon: Trophy },
    { href: '/casino', label: 'Casino', icon: Gamepad2 },
    ...(isLoggedIn 
      ? [{ href: '/profile', label: 'Profile', icon: User }]
      : [{ href: '#', label: 'Login', icon: LogIn, onClick: handleLoginClick }]
    ),
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 border-t border-gray-800 lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, onClick }) => {
          const active = pathname === href || (href !== '/' && href !== '#' && pathname.startsWith(href));
          const isLoginButton = label === 'Login';
          
          return (
            <li key={label}>
              {onClick ? (
                <button
                  onClick={onClick}
                  className={`w-full flex flex-col items-center justify-center py-3 px-2 text-xs transition-colors ${
                    isLoginButton
                      ? 'text-green-500 hover:bg-green-500/20'
                      : 'text-gray-400 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1.5 ${isLoginButton ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isLoginButton ? 'text-green-500 font-semibold' : 'text-gray-400'}`}>{label}</span>
                </button>
              ) : (
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
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}






