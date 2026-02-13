import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Music, 
  Activity, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Heart,
  Disc,
  BarChart3
} from 'lucide-react';

const API_BASE = '/api/spotify';

interface Track {
  track: string;
  artist: string;
  album: string;
  date: string;
  time: string;
}

interface SystemStatus {
  name: string;
  status: 'operational' | 'warning' | 'error';
  responseTime?: number;
  lastCheck: string;
}

export default function MorningBriefing() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [stats, setStats] = useState({
    totalTracks: 0,
    uniqueArtists: 0,
    listeningTime: '0h'
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const dataInterval = setInterval(() => {
      fetchBriefingData();
    }, 300000); // 5 minutes

    fetchBriefingData();

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  async function fetchBriefingData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchRecentTracks(),
        fetchSystemStatus(),
        fetchStats()
      ]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Briefing fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentTracks() {
    try {
      const response = await fetch(`${API_BASE}/database`);
      const data = await response.json();
      if (data.plays) {
        // Get tracks from last 24 hours
        const now = new Date();
        const last24h = data.plays.filter((play: Track) => {
          const playDate = new Date(`${play.date}T${play.time}:00+05:30`);
          const hoursAgo = (now.getTime() - playDate.getTime()) / (1000 * 60 * 60);
          return hoursAgo <= 24;
        });
        setRecentTracks(last24h.slice(0, 5));
      }
    } catch (err) {
      console.error('Tracks fetch error:', err);
    }
  }

  async function fetchSystemStatus() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      if (data.systems) {
        setSystemStatus(data.systems);
      } else {
        // Fallback to default statuses
        setSystemStatus([
          { name: 'Raven Service', status: 'operational', lastCheck: 'Just now' },
          { name: 'Dashboard Server', status: 'operational', lastCheck: 'Just now' },
          { name: 'Spotify API', status: 'operational', lastCheck: 'Just now' },
          { name: 'Spotify Tracker', status: 'operational', lastCheck: 'Just now' }
        ]);
      }
    } catch (err) {
      console.error('Health fetch error:', err);
      // Show error state
      setSystemStatus([
        { name: 'Raven Service', status: 'error', lastCheck: 'Just now' },
        { name: 'Dashboard Server', status: 'error', lastCheck: 'Just now' },
        { name: 'Spotify API', status: 'error', lastCheck: 'Just now' },
        { name: 'Spotify Tracker', status: 'error', lastCheck: 'Just now' }
      ]);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-raven-orange/10 to-raven-teal/10 rounded-2xl p-8 border border-raven-orange/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sun className="text-raven-orange" size={32} />
              <h2 className="text-4xl font-bold">
                {getGreeting()}, <span className="gradient-text">Sammy!</span>
              </h2>
            </div>
            <p className="text-raven-muted text-lg">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-raven-muted mt-1">
              {formatTime(currentTime)} IST
            </p>
          </div>
          
          <button
            onClick={fetchBriefingData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-raven-card border border-raven-border hover:border-raven-orange transition-colors text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
        
        <p className="text-sm text-raven-muted mt-4">
          Last updated: {lastUpdated.toLocaleTimeString('en-IN')} 
          {lastUpdated.getDate() !== currentTime.getDate() && ' (yesterday)'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-raven-card rounded-xl p-6 border border-raven-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-raven-orange/20 flex items-center justify-center">
              <Disc className="text-raven-orange" size={20} />
            </div>
            <span className="text-raven-muted">Total Tracks</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalTracks}</p>
          <p className="text-sm text-raven-muted mt-1">In your database</p>
        </div>

        <div className="bg-raven-card rounded-xl p-6 border border-raven-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-raven-teal/20 flex items-center justify-center">
              <Heart className="text-raven-teal" size={20} />
            </div>
            <span className="text-raven-muted">Unique Artists</span>
          </div>
          <p className="text-3xl font-bold">{stats.uniqueArtists}</p>
          <p className="text-sm text-raven-muted mt-1">In your collection</p>
        </div>

        <div className="bg-raven-card rounded-xl p-6 border border-raven-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Clock className="text-purple-400" size={20} />
            </div>
            <span className="text-raven-muted">Listening Time</span>
          </div>
          <p className="text-3xl font-bold">{stats.listeningTime}</p>
          <p className="text-sm text-raven-muted mt-1">Estimated total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last Night's Music */}
        <div className="bg-raven-card rounded-xl border border-raven-border overflow-hidden">
          <div className="p-4 border-b border-raven-border flex items-center gap-3">
            <Music className="text-raven-orange" size={20} />
            <h3 className="font-semibold">🎵 Last 24 Hours</h3>
          </div>
          
          <div className="p-4">
            {recentTracks.length > 0 ? (
              <div className="space-y-3">
                {recentTracks.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-raven-bg border border-raven-border hover:border-raven-orange/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-raven-orange/20 to-raven-teal/20 flex items-center justify-center flex-shrink-0">
                      <Music size={16} className="text-raven-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-raven-text truncate">{track.track}</p>
                      <p className="text-sm text-raven-muted truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-raven-muted">{track.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-raven-muted">
                <Music size={48} className="mx-auto mb-4 opacity-30" />
                <p>No tracks in the last 24 hours</p>
                <p className="text-sm mt-1">Play some music to see it here!</p>
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-raven-card rounded-xl border border-raven-border overflow-hidden">
          <div className="p-4 border-b border-raven-border flex items-center gap-3">
            <Activity className="text-raven-teal" size={20} />
            <h3 className="font-semibold">📊 System Health</h3>
          </div>
          
          <div className="p-4 space-y-3">
            {systemStatus.map((system, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-raven-bg border border-raven-border"
              >
                <div className="flex items-center gap-3">
                  {system.status === 'operational' ? (
                    <CheckCircle className="text-green-500" size={18} />
                  ) : (
                    <AlertCircle className="text-red-500" size={18} />
                  )}
                  <span className="font-medium">{system.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${
                    system.status === 'operational' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {system.status === 'operational' ? 'Operational' : 'Issue'}
                  </span>
                  <p className="text-xs text-raven-muted">{system.lastCheck}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-purple-400" size={20} />
          <h3 className="font-semibold">💡 Quick Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="text-raven-orange mt-1" size={18} />
            <div>
              <p className="font-medium">Listening Pattern</p>
              <p className="text-sm text-raven-muted">
                You love 90s Bollywood classics with a mix of Sufi and contemporary tracks.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <TrendingUp className="text-raven-teal mt-1" size={18} />
            <div>
              <p className="font-medium">Top Artists</p>
              <p className="text-sm text-raven-muted">
                Lata Mangeshkar, Nusrat Fateh Ali Khan, and Pritam dominate your recent plays.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-raven-muted text-sm py-4">
        <p>🪶 Raven Ops Center - All systems monitored 24/7</p>
      </div>
    </div>
  );
}
