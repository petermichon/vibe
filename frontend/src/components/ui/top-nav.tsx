import { useState, useEffect, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import {
  WifiOff,
  Settings,
  Youtube,
  Sun,
  Moon,
  SunMoon,
  Image,
} from 'lucide-react';
import { YouTubeAPI } from '@/services/youtube-api';
import { useLocation, Link } from 'react-router-dom';
import { LogoBlack, LogoWhite } from '@/components/ui/logo';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/lib/navigation';

interface NavButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  text?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
}

const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  (
    {
      icon: Icon,
      text,
      onClick,
      isActive,
      className,
      buttonClassName,
      iconClassName,
    },
    ref
  ) => {
    const content = (
      <div className="relative px-3 py-2 -mx-3 -my-2">
        <div className="relative flex items-center gap-2">
          <Icon className={cn('h-4 w-4', iconClassName)} />
          {text && <span>{text}</span>}
        </div>
      </div>
    );

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm transition-colors cursor-pointer',
          isActive && 'text-foreground',
          !isActive && 'text-muted-foreground hover:text-foreground',
          className,
          buttonClassName
        )}
      >
        {content}
      </button>
    );
  }
);

NavButton.displayName = 'NavButton';

export function TopNav() {
  const location = useLocation();
  const { theme, setTheme, toggleAutoTheme } = useTheme();
  const [backgroundMode, setBackgroundMode] = useState<'normal' | 'custom'>(
    () => {
      const savedMode = localStorage.getItem('background-mode');
      if (savedMode === 'normal' || savedMode === 'custom') {
        return savedMode;
      }
      return 'custom';
    }
  );
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ top: 0, right: 0 });
  const [youtubePermission, setYoutubePermission] = useState(
    () => localStorage.getItem('youtube-permission') !== 'false'
  );
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsPopupRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide nav
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show nav
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBackgroundChange = () => {
      const savedMode = localStorage.getItem('background-mode');
      if (savedMode === 'normal' || savedMode === 'custom') {
        setBackgroundMode(savedMode);
      } else {
        setBackgroundMode('custom');
      }
    };
    window.addEventListener('background-changed', handleBackgroundChange);
    return () =>
      window.removeEventListener('background-changed', handleBackgroundChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(target) &&
        settingsPopupRef.current &&
        !settingsPopupRef.current.contains(target)
      ) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [settingsOpen]);

  const openSettings = () => {
    if (settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect();
      setSettingsPos({ top: 64, right: window.innerWidth - rect.right });
    }
    setSettingsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleGranted = () => setYoutubePermission(true);
    const handleRevoked = () => setYoutubePermission(false);
    window.addEventListener('youtube-permission-granted', handleGranted);
    window.addEventListener('youtube-permission-revoked', handleRevoked);
    return () => {
      window.removeEventListener('youtube-permission-granted', handleGranted);
      window.removeEventListener('youtube-permission-revoked', handleRevoked);
    };
  }, []);

  const toggleYoutubePermission = () => {
    const newValue = !youtubePermission;
    setYoutubePermission(newValue);
    localStorage.setItem('youtube-permission', String(newValue));
    if (newValue) {
      YouTubeAPI.clearCache();
      window.dispatchEvent(new CustomEvent('youtube-permission-granted'));
    } else {
      window.dispatchEvent(new CustomEvent('youtube-permission-revoked'));
    }
  };

  return (
    <>
      <header
        className={cn(
          'top-nav fixed top-0 left-0 right-0 h-16 z-50 transition-transform duration-300 ease-in-out',
          'backdrop-blur-xl',
          isVisible ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="flex h-full items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center rounded-xl p-1">
                <LogoBlack className="h-8 w-auto dark:hidden" />
                <LogoWhite className="h-8 w-auto hidden dark:block" />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 ml-2">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-sm text-white transition-colors">
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </div>
            )}
            <NavButton
              icon={Settings}
              onClick={openSettings}
              isActive={settingsOpen}
              ref={settingsBtnRef}
              iconClassName="h-6 w-6"
              buttonClassName={cn(
                settingsOpen
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            />
          </div>
        </div>
      </header>

      {settingsOpen &&
        createPortal(
          <div
            ref={settingsPopupRef}
            className="fixed w-72 rounded-lg border border-border bg-card/95 backdrop-blur-lg shadow-lg z-[200]"
            style={{ top: settingsPos.top, right: settingsPos.right }}
          >
            <div className="px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">
                Settings
              </span>
            </div>
            <div className="py-1">
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Theme
                </span>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                      theme === 'light'
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                      theme === 'dark'
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={toggleAutoTheme}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                      theme === 'auto'
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <SunMoon className="h-3.5 w-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-border my-1" />
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Background
                </span>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('background-mode', 'normal');
                      setBackgroundMode('normal');
                      window.dispatchEvent(
                        new CustomEvent('background-changed')
                      );
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                      backgroundMode === 'normal'
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Normal</span>
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('background-mode', 'custom');
                      setBackgroundMode('custom');
                      window.dispatchEvent(
                        new CustomEvent('background-changed')
                      );
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                      backgroundMode === 'custom'
                        ? 'text-foreground bg-foreground/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Image className="h-3.5 w-3.5" />
                    <span>Custom</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-border my-1" />
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={toggleYoutubePermission}
              >
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  <span>Allow YouTube</span>
                </div>
                <div
                  className={cn(
                    'w-8 h-4 rounded-full transition-colors relative flex-shrink-0',
                    youtubePermission
                      ? 'bg-foreground'
                      : 'bg-muted-foreground/30'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-3 h-3 rounded-full bg-background transition-transform',
                      youtubePermission ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </div>
              </button>
            </div>
          </div>,
          document.getElementById('root')!
        )}
    </>
  );
}
