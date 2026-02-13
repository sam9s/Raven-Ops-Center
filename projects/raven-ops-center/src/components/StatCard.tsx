import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend: string;
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-raven-card rounded-xl p-5 border border-raven-border hover:border-raven-orange/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-raven-muted text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-raven-text">{value}</p>
          <p className="text-xs text-raven-muted mt-2">{trend}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}
