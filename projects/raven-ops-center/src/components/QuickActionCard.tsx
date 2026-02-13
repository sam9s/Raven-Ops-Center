import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface QuickActionCardProps {
  label: string;
  icon: LucideIcon;
  desc: string;
  color: string;
  onClick: () => void;
}

export default function QuickActionCard({ label, icon: Icon, desc, color, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl bg-gradient-to-br ${color} border border-raven-border hover:border-raven-orange/50 transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Icon className="text-raven-text" size={20} />
            <span className="font-semibold text-raven-text">{label}</span>
          </div>
          <p className="text-sm text-raven-muted">{desc}</p>
        </div>
        <ArrowRight 
          className="text-raven-muted group-hover:text-raven-orange transition-colors" 
          size={18} 
        />
      </div>
    </button>
  );
}
