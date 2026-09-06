import { Plus } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { NAVIGATION_ITEMS } from '@/lib/navigation';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

function useRippleCounter() {
  const counter = useRef(0);
  return () => ++counter.current;
}

export function NavPill() {
  const location = useLocation();
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});
  const nextRippleId = useRippleCounter();

  const addRipple =
    (itemName: string) =>
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { x, y, id: nextRippleId() };
      setRipples((prev) => ({
        ...prev,
        [itemName]: [...(prev[itemName] || []), newRipple],
      }));

      setTimeout(() => {
        setRipples((prev) => ({
          ...prev,
          [itemName]: (prev[itemName] || []).filter(
            (r) => r.id !== newRipple.id
          ),
        }));
      }, 600);
    };

  const pillClass =
    'rounded-full shadow-[inset_0_0_0_2px_rgba(128,128,128,0.2)] bg-linear-to-b from-background/80 to-background/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)] transition-all duration-300';

  return (
    <nav className={cn('bottom-nav flex items-center gap-0 p-2', pillClass)}>
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
                key={ripple.id}
                className="absolute rounded-full bg-white/30"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: '200px',
                  height: '200px',
                  marginLeft: '-100px',
                  marginTop: '-100px',
                  animation: 'ripple 0.6s ease-out forwards',
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
    </nav>
  );
}

export function AddButton() {
  const location = useLocation();
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});
  const nextRippleId = useRippleCounter();

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: nextRippleId() };
    setRipples((prev) => ({ ...prev, add: [...(prev.add || []), newRipple] }));

    setTimeout(() => {
      setRipples((prev) => ({
        ...prev,
        add: (prev.add || []).filter((r) => r.id !== newRipple.id),
      }));
    }, 600);
  };

  const pillClass =
    'rounded-full shadow-[inset_0_0_0_2px_rgba(128,128,128,0.2)] bg-linear-to-b from-background/80 to-background/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] shadow-[0_2px_8px_rgba(0,0,0,0.05)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.05)] transition-all duration-300';

  return (
    <button
      onMouseDown={addRipple}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('open-add-dialog'));
      }}
      className={cn(
        'flex items-center justify-center w-12 h-12 rounded-full hover:bg-foreground/10 active:scale-90 transition-all duration-300 relative overflow-hidden touch-action-manipulation select-none cursor-pointer',
        pillClass,
        location.pathname === '/player' &&
          'opacity-0 w-0 p-0 pointer-events-none'
      )}
    >
      {(ripples['add'] || []).map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '200px',
            height: '200px',
            marginLeft: '-100px',
            marginTop: '-100px',
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}
      <Plus className="h-5 w-5 relative z-10 text-foreground" />
    </button>
  );
}
