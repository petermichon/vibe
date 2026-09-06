import { Play, Home, Heart, Plus } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Player', href: '/player', icon: Play },
  { name: 'Following', href: '/following', icon: Heart },
];

interface Ripple {
  x: number;
  y: number;
  key: number;
}

export function BottomNav() {
  const location = useLocation();
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});

  const addRipple =
    (itemName: string) =>
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, key: Date.now() };
      setRipples((prev) => ({
        ...prev,
        [itemName]: [...(prev[itemName] || []), newRipple],
      }));

      setTimeout(() => {
        setRipples((prev) => ({
          ...prev,
          [itemName]: (prev[itemName] || []).filter(
            (r) => r.key !== newRipple.key
          ),
        }));
      }, 1500);
    };

  return (
    <div className="bottom-nav-container md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
      <nav className="bottom-nav rounded-full shadow-[inset_0_0_0_2px_rgba(128,128,128,0.2)] bg-linear-to-b from-background/80 to-background/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)] transition-all duration-300">
        <div className="flex h-full items-center justify-center p-2 gap-0">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onMouseDown={addRipple(item.name)}
                onContextMenu={(e) => e.preventDefault()}
                className={cn(
                  'flex flex-row items-center px-5 py-3 rounded-full text-sm font-medium transition-[width,opacity] duration-300 relative overflow-hidden hover:bg-white/10 active:scale-90 transition-transform duration-75 touch-action-manipulation select-none',
                  isActive && 'text-foreground hover:bg-white/10',
                  !isActive && 'text-muted-foreground'
                )}
              >
                {(ripples[item.name] || []).map((ripple) => (
                  <span
                    key={ripple.key}
                    className="absolute rounded-full bg-white/20 animate-ping"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '200px',
                      height: '200px',
                      marginLeft: '-100px',
                      marginTop: '-100px',
                      animationDuration: '1.5s',
                    }}
                  />
                ))}
                <item.icon className="h-5 w-5 relative z-10" />
                <span
                  className={cn(
                    'relative z-10 transition-all duration-300 overflow-hidden whitespace-nowrap',
                    isActive
                      ? 'opacity-100 max-w-20 ml-1.5'
                      : 'opacity-0 max-w-0 ml-0'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <button
        onMouseDown={addRipple('add')}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('open-add-dialog'));
        }}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full shadow-[inset_0_0_0_2px_rgba(128,128,128,0.2)] bg-linear-to-b from-background/80 to-background/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)] hover:bg-foreground/10 active:scale-90 transition-all duration-300 relative overflow-hidden touch-action-manipulation select-none',
          location.pathname === '/player' &&
            'opacity-0 w-0 p-0 pointer-events-none'
        )}
      >
        {(ripples['add'] || []).map((ripple) => (
          <span
            key={ripple.key}
            className="absolute rounded-full bg-white/20 animate-ping"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: '200px',
              height: '200px',
              marginLeft: '-100px',
              marginTop: '-100px',
              animationDuration: '1.5s',
            }}
          />
        ))}
        <Plus className="h-5 w-5 relative z-10 text-foreground" />
      </button>
    </div>
  );
}
