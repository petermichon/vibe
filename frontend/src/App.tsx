import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopNav } from '@/components/ui/top-nav';
import { BottomNav } from '@/components/ui/bottom-nav';
import { VideoProvider } from '@/contexts/video-context';
import { SubscriptionsProvider } from '@/contexts/subscriptions-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { Player } from '@/pages/Player';
import { Home } from '@/pages/Home';
import { Following } from '@/pages/Following';

function AppContent() {
  const [backgroundImage, setBackgroundImage] = useState(() => {
    return localStorage.getItem('home-background');
  });
  const [backgroundMode, setBackgroundMode] = useState<'normal' | 'custom'>(
    () => {
      const savedMode = localStorage.getItem('background-mode');
      if (savedMode === 'normal' || savedMode === 'custom') {
        return savedMode;
      }
      return 'custom';
    }
  );

  useEffect(() => {
    const handleBackgroundChange = () => {
      setBackgroundImage(localStorage.getItem('home-background'));
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

  return (
    <>
      {backgroundMode === 'custom' && backgroundImage && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              backgroundImage.startsWith('linear-gradient') ||
              backgroundImage.startsWith('radial-gradient')
                ? backgroundImage
                : `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            transition: 'background-image 0.5s ease-in-out',
          }}
        >
          <div
            className="absolute inset-0 backdrop-blur-[100px]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}
      <div className="flex h-dvh flex-col overflow-hidden relative z-10">
        <TopNav />
        <main className="app-layout flex-1 min-h-0 pt-16 pb-16 md:pb-0 grid overflow-y-auto overscroll-y-contain scroll-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player" element={<Player />} />
            <Route path="/following" element={<Following />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <VideoProvider>
          <SubscriptionsProvider>
            <AppContent />
          </SubscriptionsProvider>
        </VideoProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
