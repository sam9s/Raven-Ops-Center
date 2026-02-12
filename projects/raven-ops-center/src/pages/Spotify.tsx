import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Clock,
  Music,
  TrendingUp,
  Calendar,
  Search,
  Database,
  Disc,
  Loader2,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Headphones,
  BarChart3,
  Star
} from 'lucide-react';
import StatCard from '../components/StatCard';

const API_BASE = '/api/spotify';

interface Track {
  name: string;
  artist: string;
  album: string;
  image?: string;
  duration_ms: number;
  progress_ms: number;
}

interface NowPlayingData {
  isPlaying: boolean;
  track: Track | null;
  error?: string;
}

interface RecentTrack {
  name: string;
  artist: string;
  album: string;
  playedAt: string;
  duration: string;
}

interface DatabasePlay {
  date: string;
  time: string;
  track: string;
  artist: string;
  album: string;
  source: string;
  note: string;
}

interface StatsData {
  totalTracks: number;
  listeningTime: string;
  topArtist: string;
  uniqueArtists: number;
}

interface ArtistStat {
  name: string;
  plays: number;
  percentage: number;
}

interface TimeStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export default function Spotify() {
  const [activeTab, setActiveTab] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [database, setDatabase] = useState<{plays: DatabasePlay[], raw: string}>({ plays: [], raw: '' });
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlling, setControlling] = useState(false);

  const tabs = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'discover', label: 'Discover', icon: Disc },
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchNowPlaying(),
        fetchRecentTracks(),
        fetchDatabase(),
        fetchStats()
      ]);
    } catch (err) {
      setError('Failed to load Spotify data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchNowPlaying() {
    try {
      const response = await fetch(`${API_BASE}/now-playing`);
      const data = await response.json();
      setNowPlaying(data);
    } catch (err) {
      console.error('Now playing error:', err);
    }
  }

  async function fetchRecentTracks() {
    try {
      const response = await fetch(`${API_BASE}/recent-tracks`);
      const data = await response.json();
      setRecentTracks(data);
    } catch (err) {
      console.error('Recent tracks error:', err);
    }
  }

  async function fetchDatabase() {
    try {
      const response = await fetch(`${API_BASE}/database`);
      const data = await response.json();
      setDatabase(data);
    } catch (err) {
      console.error('Database error:', err);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  async function controlPlayer(action: 'play' | 'pause' | 'next' | 'previous') {
    setControlling(true);
    try {
      const response = await fetch(`${API_BASE}/${action}`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        setTimeout(fetchNowPlaying, 500);
      }
    } catch (err) {
      console.error('Control error:', err);
    } finally {
      setControlling(false);
    }
  }

  // Calculate detailed stats from database
  const detailedStats = useMemo(() => {
    if (!database.plays.length) return null;

    const plays = database.plays;
    
    // Artist frequency
    const artistCounts: Record<string, number> = {};
    plays.forEach(play => {
      artistCounts[play.artist] = (artistCounts[play.artist] || 0) + 1;
    });
    
    const topArtists: ArtistStat[] = Object.entries(artistCounts)
      .map(([name, plays]) => ({ name, plays, percentage: 0 }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);
    
    // Calculate percentages
    const totalPlays = plays.length;
    topArtists.forEach(artist => {
      artist.percentage = Math.round((artist.plays / totalPlays) * 100);
    });

    // Time-based stats (assuming ~3 min per song average)
    const avgSongDuration = 3;
    const totalMinutes = plays.length * avgSongDuration;
    const totalHours = Math.floor(totalMinutes / 60);
    
    // Parse dates for time-based analysis
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const timeStats: TimeStats = {
      today: plays.filter(p => p.date === today).length,
      thisWeek: plays.filter(p => p.date >= weekAgo).length,
      thisMonth: plays.filter(p => p.date >= monthAgo).length,
      total: plays.length
    };

    // Extract unique albums
    const albumCounts: Record<string, { artist: string, count: number }> = {};
    plays.forEach(play => {
      const key = `${play.album}|${play.artist}`;
      if (!albumCounts[key]) {
        albumCounts[key] = { artist: play.artist, count: 0 };
      }
      albumCounts[key].count++;
    });
    
    const topAlbums = Object.entries(albumCounts)
      .map(([key, data]) => {
        const [album] = key.split('|');
        return { album, artist: data.artist, plays: data.count };
      })
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);

    return {
      topArtists,
      timeStats,
      topAlbums,
      totalListeningHours: totalHours,
      avgDailyPlays: Math.round(totalPlays / Math.max(1, plays.length > 0 ? 
        (new Date(plays[0].date).getTime() - new Date(plays[plays.length - 1].date).getTime()) / (1000 * 60 * 60 * 24) : 1))
    };
  }, [database.plays]);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  // Fetch recommendations from API
  useEffect(() => {
    async function fetchDiscover() {
      try {
        setDiscoverLoading(true);
        const response = await fetch(`${API_BASE}/discover`);
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data);
        }
      } catch (err) {
        console.error('Discover fetch error:', err);
        setRecommendations([]);
      } finally {
        setDiscoverLoading(false);
      }
    }
    fetchDiscover();
  }, []);

  function formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  const filteredDatabase = database.plays.filter(play => 
    searchQuery === '' || 
    play.track.toLowerCase().includes(searchQuery.toLowerCase()) ||
    play.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    play.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-raven-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Spotify <span className="gradient-text">Command Center</span>
        </h2>
        <p className="text-raven-muted">Your music intelligence and listening analytics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Now Playing */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-raven-card to-raven-bg rounded-2xl p-6 border border-raven-border sticky top-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Music className="text-raven-teal" size={20} />
              Now Playing
            </h3>

            {nowPlaying?.isPlaying && nowPlaying.track ? (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-2xl">
                  {nowPlaying.track.image ? (
                    <img 
                      src={nowPlaying.track.image} 
                      alt={nowPlaying.track.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-raven-orange to-raven-teal flex items-center justify-center">
                      <Music size={64} className="text-white" />
                    </div>
                  )}
                </div>
                
                <h4 className="text-xl font-bold mb-1">{nowPlaying.track.name}</h4>
                <p className="text-raven-muted mb-4">{nowPlaying.track.artist}</p>
                <p className="text-sm text-raven-muted mb-6">{nowPlaying.track.album}</p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-1 bg-raven-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-raven-orange to-raven-teal rounded-full transition-all"
                      style={{ 
                        width: `${(nowPlaying.track.progress_ms / nowPlaying.track.duration_ms) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-raven-muted mt-2">
                    <span>{formatDuration(nowPlaying.track.progress_ms)}</span>
                    <span>{formatDuration(nowPlaying.track.duration_ms)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => controlPlayer('previous')}
                    disabled={controlling}
                    className="p-2 text-raven-muted hover:text-raven-text transition-colors disabled:opacity-50"
                  >
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={() => controlPlayer('pause')}
                    disabled={controlling}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-raven-orange to-raven-teal flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    <Pause size={28} />
                  </button>
                  <button 
                    onClick={() => controlPlayer('next')}
                    disabled={controlling}
                    className="p-2 text-raven-muted hover:text-raven-text transition-colors disabled:opacity-50"
                  >
                    <SkipForward size={24} />
                  </button>
                </div>

                <button className="mt-6 w-full py-3 rounded-lg border border-raven-border text-raven-muted hover:text-raven-orange hover:border-raven-orange transition-colors flex items-center justify-center gap-2">
                  <Heart size={18} />
                  Add to Database
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-32 h-32 mx-auto mb-6 rounded-xl bg-raven-border flex items-center justify-center">
                  <Music size={48} className="text-raven-muted" />
                </div>
                <p className="text-raven-muted mb-4">Nothing playing right now</p>
                <button 
                  onClick={() => controlPlayer('play')}
                  disabled={controlling}
                  className="px-6 py-3 rounded-full bg-gradient-to-br from-raven-orange to-raven-teal text-white hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  <PlayCircle size={20} />
                  Resume Playback
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total Tracks" 
              value={stats?.totalTracks.toString() || detailedStats?.timeStats.total.toString() || '0'} 
              icon={Database}
              color="from-raven-orange to-orange-400"
              trend="In database"
            />
            <StatCard 
              label="Listening Time" 
              value={detailedStats ? `${detailedStats.totalListeningHours}h` : (stats?.listeningTime || '0h')} 
              icon={Clock}
              color="from-raven-teal to-teal-400"
              trend="Estimated"
            />
            <StatCard 
              label="Top Artist" 
              value={detailedStats?.topArtists[0]?.name || stats?.topArtist || 'Unknown'} 
              icon={Music}
              color="from-purple-500 to-pink-500"
              trend="Most played"
            />
            <StatCard 
              label="Unique Artists" 
              value={stats?.uniqueArtists.toString() || detailedStats?.topArtists.length.toString() || '0'} 
              icon={TrendingUp}
              color="from-blue-500 to-cyan-500"
              trend="All time"
            />
          </div>

          {/* Tabs */}
          <div className="bg-raven-card rounded-xl border border-raven-border overflow-hidden">
            <div className="flex border-b border-raven-border">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-raven-orange border-b-2 border-raven-orange bg-raven-orange/5'
                        : 'text-raven-muted hover:text-raven-text'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Recent Tab */}
              {activeTab === 'recent' && (
                <div className="space-y-4">
                  <h4 className="font-semibold mb-4">Recently Played (Last 3)</h4>
                  {recentTracks.length > 0 ? (
                    recentTracks.slice(0, 3).map((track, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-4 p-4 rounded-lg bg-raven-bg border border-raven-border hover:border-raven-orange/30 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-raven-orange/20 to-raven-teal/20 flex items-center justify-center">
                          <Music size={20} className="text-raven-muted" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-raven-text">{track.name}</p>
                          <p className="text-sm text-raven-muted">{track.artist} • {track.album}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-raven-muted">{track.duration}</p>
                          <p className="text-xs text-raven-muted">{track.playedAt}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-raven-muted">
                      <Music size={48} className="mx-auto mb-4 opacity-30" />
                      <p>No recent tracks from Spotify API</p>
                      <p className="text-sm mt-2">Check Database tab for your history</p>
                    </div>
                  )}
                </div>
              )}

              {/* Database Tab */}
              {activeTab === 'database' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-raven-muted" size={18} />
                      <input
                        type="text"
                        placeholder="Search your music database..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-raven-bg border border-raven-border rounded-lg pl-10 pr-4 py-2 text-sm text-raven-text placeholder-raven-muted focus:outline-none focus:border-raven-orange transition-colors"
                      />
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-raven-orange text-white text-sm hover:bg-raven-orange/80 transition-colors">
                      Export CSV
                    </button>
                  </div>
                  
                  <p className="text-sm text-raven-muted mb-4">
                    Showing {filteredDatabase.length} tracks from your database
                  </p>
                  
                  {filteredDatabase.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredDatabase.map((play, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-4 p-3 rounded-lg bg-raven-bg border border-raven-border hover:border-raven-orange/30 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-raven-orange/20 to-raven-teal/20 flex items-center justify-center flex-shrink-0">
                            <Music size={16} className="text-raven-muted" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-raven-text truncate">{play.track}</p>
                            <p className="text-sm text-raven-muted truncate">{play.artist} • {play.album}</p>
                          </div>
                          <div className="text-right text-xs text-raven-muted">
                            <p>{play.date}</p>
                            <p>{play.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-raven-muted">
                      <Database size={48} className="mx-auto mb-4 opacity-30" />
                      <p>{searchQuery ? 'No tracks match your search' : 'No tracks in database'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Tab - NOW FULLY IMPLEMENTED */}
              {activeTab === 'stats' && detailedStats && (
                <div className="space-y-6">
                  {/* Time Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-raven-bg rounded-xl p-4 border border-raven-border text-center">
                      <p className="text-2xl font-bold text-raven-orange">{detailedStats.timeStats.today}</p>
                      <p className="text-sm text-raven-muted">Today</p>
                    </div>
                    <div className="bg-raven-bg rounded-xl p-4 border border-raven-border text-center">
                      <p className="text-2xl font-bold text-raven-teal">{detailedStats.timeStats.thisWeek}</p>
                      <p className="text-sm text-raven-muted">This Week</p>
                    </div>
                    <div className="bg-raven-bg rounded-xl p-4 border border-raven-border text-center">
                      <p className="text-2xl font-bold text-purple-400">{detailedStats.timeStats.thisMonth}</p>
                      <p className="text-sm text-raven-muted">This Month</p>
                    </div>
                  </div>

                  {/* Top Artists */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-raven-orange" />
                      Top Artists
                    </h4>
                    <div className="space-y-3">
                      {detailedStats.topArtists.slice(0, 5).map((artist, index) => (
                        <div key={artist.name} className="flex items-center gap-4">
                          <span className="text-raven-muted w-6">{index + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{artist.name}</span>
                              <span className="text-sm text-raven-muted">{artist.plays} plays ({artist.percentage}%)</span>
                            </div>
                            <div className="h-2 bg-raven-bg rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-raven-orange to-raven-teal rounded-full"
                                style={{ width: `${artist.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Albums */}
                  <div>
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Disc size={18} className="text-raven-teal" />
                      Top Albums
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailedStats.topAlbums.map((album, index) => (
                        <div key={album.album} className="flex items-center gap-3 p-3 rounded-lg bg-raven-bg border border-raven-border">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-raven-orange/20 to-raven-teal/20 flex items-center justify-center text-raven-orange font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-raven-text truncate">{album.album}</p>
                            <p className="text-sm text-raven-muted truncate">{album.artist}</p>
                          </div>
                          <span className="text-sm text-raven-orange">{album.plays}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && !detailedStats && (
                <div className="text-center py-12 text-raven-muted">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No stats available yet</p>
                  <p className="text-sm mt-2">Play some music to see your stats</p>
                </div>
              )}

              {/* Discover Tab - NOW WITH REAL API */}
              {activeTab === 'discover' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-raven-orange mb-4">
                    <Sparkles size={20} />
                    <span className="font-semibold">AI-Powered Recommendations</span>
                  </div>

                  {discoverLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-raven-orange" size={32} />
                      <span className="ml-3 text-raven-muted">Finding music you'll love...</span>
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          onClick={() => rec.spotifyUrl && window.open(rec.spotifyUrl, '_blank')}
                          className="p-4 rounded-xl bg-raven-bg border border-raven-border hover:border-raven-orange/50 transition-all group cursor-pointer flex items-center gap-4"
                        >
                          {rec.image ? (
                            <img
                              src={rec.image}
                              alt={rec.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-raven-orange/20 flex items-center justify-center flex-shrink-0">
                              <Music size={28} className="text-raven-orange" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-raven-text group-hover:text-raven-orange transition-colors truncate">
                                {rec.title}
                              </h5>
                              <span className="px-2 py-0.5 rounded-full bg-raven-orange/20 text-raven-orange text-xs font-medium flex-shrink-0">
                                {rec.match}% match
                              </span>
                            </div>
                            <p className="text-sm text-raven-muted truncate">{rec.subtitle}</p>
                            <p className="text-xs text-raven-muted flex items-center gap-1 mt-1">
                              <Star size={12} className="text-raven-orange" />
                              {rec.reason}
                            </p>
                          </div>
                          <div className="text-raven-muted group-hover:text-raven-orange transition-colors">
                            <PlayCircle size={24} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-raven-muted">
                      <Disc size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No recommendations available yet</p>
                      <p className="text-sm mt-2">Keep listening to get personalized suggestions</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-raven-orange/10 to-raven-teal/10 border border-raven-orange/30">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-raven-orange" />
                      How it works
                    </h5>
                    <p className="text-sm text-raven-muted">
                      These recommendations are generated by analyzing your listening history and
                      querying Spotify's AI. We look at your top artists and find similar songs,
                      filtering out remixes. Refreshed every 3 hours.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
