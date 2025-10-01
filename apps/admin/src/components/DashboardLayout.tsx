import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

/**
 * Dashboard Layout
 * Main layout with sidebar navigation
 */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/quests', label: 'Quests', icon: '⚔️' },
    { href: '/poi', label: 'POIs', icon: '📍' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/battles', label: 'Battles', icon: '🎮' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/config', label: 'Config', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-dark">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-darker border-r border-gray-800 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">⚔️ ROV Admin</h2>
          <p className="text-sm text-gray-400 mt-1">Realm of Valor</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href ||
              (item.href !== '/' && router.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-accent hover:text-white'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-accent rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Logged in as</p>
            <p className="text-sm text-white font-semibold">Admin User</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}