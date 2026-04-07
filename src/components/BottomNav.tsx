import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, List, User, Hammer, History as HistoryIcon } from 'lucide-react';

const navItems = [
  { path: '/', icon: Hammer, label: 'Marking' },
  { path: '/history', icon: HistoryIcon, label: 'History' },
  { path: '/my-account', icon: User, label: 'My Account' },
];

export function BottomNav() {
  const location = useLocation();

  // Hide nav during active marking page for maximum screen longevity
  if (location.pathname === '/marking') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="flex items-center justify-around h-16 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Glass Sheen */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative group
                  ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {/* Active Indicator Background */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-xl" />
                )}

                {/* Active Glow Dot */}
                {active && (
                  <div className="absolute top-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                )}

                <div className={`p-1.5 transition-transform duration-300 ${active ? 'transform -translate-y-1' : ''}`}>
                  <Icon className={`h-6 w-6 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
