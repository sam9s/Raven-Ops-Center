import React, { useState, useEffect } from 'react';
import { Shield, Activity, Server, Brain, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface HealthStatus {
  service: boolean;
  ipv4Shield: boolean;
  logs: boolean;
  brain: boolean;
  pid?: string;
  memory?: string;
  lastCheck: string;
  lastCheckTime?: string;
}

export default function HealthStatusCard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  async function checkHealth() {
    try {
      // Read from the health log file in build folder
      const response = await fetch('/health-logs-latest.txt');
      let text = '';
      
      if (response.ok) {
        text = await response.text();
      } else {
        throw new Error('Health log not found');
      }
      
      const service = text.includes('✅ SERVICE:');
      const ipv4Shield = text.includes('✅ NETWORK:');
      const logs = text.includes('✅ LOGS:');
      const brain = text.includes('✅ BRAIN:');
      
      // Extract PID and memory
      const pidMatch = text.match(/PID:\s*(\d+)/);
      const memMatch = text.match(/Memory Usage:\s*([\d.]+\s*MB)/);
      
      // Extract last check time and convert to IST
      const timeMatch = text.match(/Last check:\s*([\d-]+\s+[\d:]+)/);
      let displayTime = timeMatch?.[1] || 'Unknown';
      if (displayTime !== 'Unknown') {
        try {
          const utcDate = new Date(displayTime + 'Z'); // Parse as UTC
          const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours
          displayTime = istDate.toISOString().replace('T', ' ').substring(0, 19) + ' IST';
        } catch (e) {
          console.error('Time conversion error:', e);
        }
      }
      
      setHealth({
        service,
        ipv4Shield,
        logs,
        brain,
        pid: pidMatch?.[1],
        memory: memMatch?.[1],
        lastCheck: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        lastCheckTime: displayTime
      });
    } catch (err) {
      console.error('Health check error:', err);
      setHealth({
        service: false,
        ipv4Shield: false,
        logs: false,
        brain: false,
        lastCheck: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        lastCheckTime: 'Error'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      // Call API to run health check script
      const response = await fetch('/api/run-health-check', { method: 'POST' });
      if (response.ok) {
        // Wait a moment then refresh
        setTimeout(async () => {
          await checkHealth();
          setRefreshing(false);
        }, 2000);
      } else {
        // Fallback: just refresh from existing file
        await checkHealth();
        setRefreshing(false);
      }
    } catch (err) {
      // If API fails, just refresh from file
      await checkHealth();
      setRefreshing(false);
    }
  }

  const allHealthy = health?.service && health?.ipv4Shield && health?.logs && health?.brain;

  if (loading) {
    return (
      <div className="bg-raven-card rounded-xl p-6 border border-raven-border animate-pulse">
        <div className="h-4 bg-raven-border rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-raven-border rounded"></div>
          <div className="h-3 bg-raven-border rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-raven-card rounded-xl p-6 border ${allHealthy ? 'border-green-500/30' : 'border-red-500/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${allHealthy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {allHealthy ? <Shield className="text-green-400" size={20} /> : <AlertCircle className="text-red-400" size={20} />}
          </div>
          <div>
            <h3 className="font-semibold">System Health</h3>
            <p className="text-xs text-raven-muted">
              Script ran: {health?.lastCheckTime || 'Unknown'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${allHealthy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {allHealthy ? '🟢 ALL GOOD' : '🔴 ISSUES DETECTED'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`flex items-center gap-2 p-3 rounded-lg ${health?.service ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Server size={16} className={health?.service ? 'text-green-400' : 'text-red-400'} />
          <div className="flex-1">
            <p className="text-sm font-medium">Service</p>
            <p className="text-xs text-raven-muted">{health?.service ? 'Running' : 'Down'}</p>
          </div>
          {health?.service ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${health?.ipv4Shield ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Shield size={16} className={health?.ipv4Shield ? 'text-green-400' : 'text-red-400'} />
          <div className="flex-1">
            <p className="text-sm font-medium">IPv4 Shield</p>
            <p className="text-xs text-raven-muted">{health?.ipv4Shield ? 'Active' : 'Missing'}</p>
          </div>
          {health?.ipv4Shield ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${health?.logs ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Activity size={16} className={health?.logs ? 'text-green-400' : 'text-red-400'} />
          <div className="flex-1">
            <p className="text-sm font-medium">Logs</p>
            <p className="text-xs text-raven-muted">{health?.logs ? 'IPv4 Confirmed' : 'Unknown'}</p>
          </div>
          {health?.logs ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${health?.brain ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Brain size={16} className={health?.brain ? 'text-green-400' : 'text-red-400'} />
          <div className="flex-1">
            <p className="text-sm font-medium">Brain</p>
            <p className="text-xs text-raven-muted">{health?.brain ? (health.memory || 'Active') : 'Not Active'}</p>
          </div>
          {health?.brain ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-raven-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-raven-muted">
            Auto-check: 09:00 & 21:00 IST • Manual: Anytime
          </p>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-raven-orange hover:text-raven-teal transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Running...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
