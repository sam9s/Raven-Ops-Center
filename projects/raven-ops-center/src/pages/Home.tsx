import React from 'react';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Music,
  Share2,
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import RecentActivity from '../components/RecentActivity';
import HealthStatusCard from '../components/HealthStatusCard';
import ResourcePulseCard from '../components/ResourcePulseCard';

export default function Home() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [activities, setActivities] = React.useState([
    { 
      type: 'calendar', 
      title: 'Google OAuth automation completed', 
      time: '30 min ago',
      status: 'success'
    },
    { 
      type: 'task', 
      title: 'Calendar event created on your account', 
      time: '35 min ago',
      status: 'success'
    },
    { 
      type: 'task', 
      title: 'Email notification sent', 
      time: '35 min ago',
      status: 'success'
    },
    { 
      type: 'social', 
      title: 'Seamless OAuth flow tested successfully', 
      time: '1 hour ago',
      status: 'success'
    },
    { 
      type: 'file', 
      title: 'Documentation updated for Anna Kitney', 
      time: '2 hours ago',
      status: 'success'
    },
    { 
      type: 'task', 
      title: 'Dashboard health monitoring fixed', 
      time: '3 hours ago',
      status: 'success'
    },
  ]);

  const stats = [
    { 
      label: 'Active Projects', 
      value: '3', 
      icon: Zap, 
      color: 'from-raven-orange to-orange-400',
      trend: '+1 this week'
    },
    { 
      label: 'Tasks To Do', 
      value: '8', 
      icon: Clock, 
      color: 'from-yellow-500 to-yellow-400',
      trend: '3 due today'
    },
    { 
      label: 'In Progress', 
      value: '4', 
      icon: TrendingUp, 
      color: 'from-blue-500 to-blue-400',
      trend: 'On track'
    },
    { 
      label: 'Completed', 
      value: '12', 
      icon: CheckCircle, 
      color: 'from-raven-teal to-teal-400',
      trend: 'This month'
    },
  ];

  const quickActions = [
    { 
      label: 'Morning Briefing', 
      icon: Zap, 
      desc: 'View today\'s briefing',
      color: 'from-raven-orange/20 to-raven-orange/5',
      onClick: () => console.log('briefing')
    },
    { 
      label: 'Spotify Stats', 
      icon: Music, 
      desc: 'Check listening data',
      color: 'from-green-500/20 to-green-500/5',
      onClick: () => window.location.href = '/#/spotify'
    },
    { 
      label: 'Social Overview', 
      icon: Share2, 
      desc: 'YouTube, Twitter status',
      color: 'from-blue-500/20 to-blue-500/5',
      onClick: () => console.log('social')
    },
    { 
      label: 'New Task', 
      icon: FileText, 
      desc: 'Add to Kanban board',
      color: 'from-purple-500/20 to-purple-500/5',
      onClick: () => console.log('task')
    },
  ];

  async function handleRefresh() {
    setRefreshing(true);
    // The HealthStatusCard has its own refresh mechanism
    // This is just for visual feedback
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Good afternoon, <span className="gradient-text font-sammy">Sammy</span>
          </h2>
          <p className="text-raven-muted">Here's what's happening with your projects today.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-raven-card border border-raven-border text-raven-text hover:border-raven-orange transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Resource Pulse - RAM Guardian */}
      <ResourcePulseCard />

      {/* Health Status */}
      <HealthStatusCard />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <button className="text-sm text-raven-orange hover:text-raven-teal transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>

          {/* System Status */}
          <div className="mt-6 bg-raven-card rounded-xl p-6 border border-raven-border">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Notion API', status: 'Connected', icon: '✓', color: 'text-green-400' },
                { name: 'YouTube API', status: 'Connected', icon: '✓', color: 'text-green-400' },
                { name: 'Spotify API', status: 'Connected', icon: '✓', color: 'text-green-400' },
                { name: 'Google OAuth', status: 'Active', icon: '✓', color: 'text-green-400' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between py-2 border-b border-raven-border last:border-0">
                  <span className="text-raven-text">{service.name}</span>
                  <span className={`flex items-center gap-2 ${service.color}`}>
                    <span>{service.icon}</span>
                    <span className="text-sm">{service.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <RecentActivity activities={activities} />
        </div>
      </div>
    </div>
  );
}
