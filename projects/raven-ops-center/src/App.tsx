import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Spotify from './pages/Spotify';
import OAuthCallback from './pages/OAuthCallback';
import './index.css';

function App() {
  const [activePage, setActivePage] = React.useState('home');
  
  // Check if we're on the OAuth callback route
  const isOAuthCallback = window.location.pathname === '/auth/callback';
  
  // Handle OAuth callback route
  if (isOAuthCallback) {
    return <OAuthCallback />;
  }

  return (
    <div className="flex h-screen bg-raven-bg text-raven-text overflow-hidden">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === 'home' && <Home />}
          {activePage === 'briefing' && <div className="text-raven-muted">Morning Briefing - Coming soon</div>}
          {activePage === 'spotify' && <Spotify />}
          {activePage === 'projects' && <div className="text-raven-muted">Projects - Coming soon</div>}
          {activePage === 'social' && <div className="text-raven-muted">Social Intelligence - Coming soon</div>}
          {activePage === 'google' && <div className="text-raven-muted">Google Ecosystem - Coming soon</div>}
          {activePage === 'explorer' && <div className="text-raven-muted">Workspace Explorer - Coming soon</div>}
          {activePage === 'activity' && <div className="text-raven-muted">Activity Log - Coming soon</div>}
        </main>
      </div>
    </div>
  );
}

export default App;
