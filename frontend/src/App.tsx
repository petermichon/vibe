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
  return (
    <>
      <div className="flex h-dvh flex-col overflow-hidden">
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
