import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Activity, RefreshCw } from 'lucide-react';

interface ResourceStatus {
  ram: string;
  cpu: string;
  status: string;
  lastCheck: string;
  isAutoRefresh: boolean;
}

export default function ResourcePulseCard() {
  const [resources, setResources] = useState<ResourceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkResources();
    const interval = setInterval(checkResources, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  async function checkResources() {
    try {
      const response = await fetch('/RAM_STATUS.md?t=' + Date.now()); // Cache buster
      if (!response.ok) {
        throw new Error('RAM status file not found: ' + response.status);
      }
      
      const text = await response.text();
      
      // Parse the markdown - handle emoji and different formats
      const ramMatch = text.match(/RAM Usage:\*\*\s*([\d.]+)\s*MB/i);
      const cpuMatch = text.match(/CPU Load:\*\*\s*([\d.]+)%/i);
      // Status can have emoji before it: "### ✅ Status: HEALTHY" or "**Status: HEALTHY**"
      const statusMatch = text.match(/Status:\s*(\w+)/i);
      const timeMatch = text.match(/Last Check:\*\*\s*([\d-]+\s+[\d:]+)/i);
      const autoRefresh = text.includes('AUTO-REFRESH');
      
      const rawStatus = statusMatch?.[1] || 'Unknown';
      const normalizedStatus = rawStatus.toUpperCase();
      
      // Convert UTC to IST (UTC+5:30)
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
      
      setResources({
        ram: ramMatch ? `${ramMatch[1]} MB` : 'Unknown',
        cpu: cpuMatch ? `${cpuMatch[1]}%` : 'Unknown',
        status: normalizedStatus,
        lastCheck: displayTime,
        isAutoRefresh: autoRefresh
      });
    } catch (err) {
      console.error('Resource check error:', err);
      setResources({
        ram: 'Unknown',
        cpu: 'Unknown',
        status: 'ERROR',
        lastCheck: 'Error loading',
        isAutoRefresh: false
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkResources();
    setTimeout(() => setRefreshing(false), 500);
  }

  const isHealthy = resources?.status === 'HEALTHY';
  const ramValue = parseFloat(resources?.ram || '0');
  const ramPercent = Math.min((ramValue / 2048) * 100, 100); // 2GB max

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
    <div className={`bg-raven-card rounded-xl p-6 border ${isHealthy ? 'border-raven-teal/30' : 'border-red-500/30'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isHealthy ? 'bg-raven-teal/20' : 'bg-red-500/20'}`}>
            <Activity className={isHealthy ? 'text-raven-teal' : 'text-red-400'} size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Resource Pulse</h3>
            <p className="text-xs text-raven-muted">
              RAM Guardian • {resources?.lastCheck}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {resources?.isAutoRefresh && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
              🔄 AUTO-REFRESH
            </span>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${isHealthy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {resources?.status === 'HEALTHY' ? '🟢 HEALTHY' : '🔴 ' + resources?.status}
          </div>
        </div>
      </div>

      {/* RAM Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-raven-muted" />
            <span className="text-sm font-medium">RAM Usage</span>
          </div>
          <span className={`text-sm font-bold ${ramValue > 1800 ? 'text-red-400' : ramValue > 1500 ? 'text-yellow-400' : 'text-green-400'}`}>
            {resources?.ram}
          </span>
        </div>
        <div className="h-2 bg-raven-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              ramValue > 1800 ? 'bg-red-500' : ramValue > 1500 ? 'bg-yellow-500' : 'bg-gradient-to-r from-raven-teal to-green-400'
            }`}
            style={{ width: `${ramPercent}%` }}
          ></div>
        </div>
        <p className="text-xs text-raven-muted mt-1">
          {ramValue > 1800 ? '⚠️ High usage - Guardian may restart process' : 
           ramValue > 1500 ? '⚡ Elevated - Monitoring closely' : 
           '✅ Optimal performance range'}
        </p>
      </div>

      {/* CPU Load */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-raven-bg">
        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-raven-muted" />
          <span className="text-sm">CPU Load</span>
        </div>
        <span className={`text-sm font-bold ${parseFloat(resources?.cpu || '0') > 80 ? 'text-red-400' : 'text-green-400'}`}>
          {resources?.cpu}
        </span>
      </div>

      {/* Guardian Info */}
      <div className="mt-4 pt-4 border-t border-raven-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-raven-muted">
            Guardian checks hourly • Max RAM: 2GB
          </p>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-raven-orange hover:text-raven-teal transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Reading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
