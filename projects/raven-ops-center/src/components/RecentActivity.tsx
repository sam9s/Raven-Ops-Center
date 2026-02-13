import React from 'react';
import { CheckCircle, Music, FileText, Database, Share2 } from 'lucide-react';

interface Activity {
  type: string;
  title: string;
  time: string;
  status: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const typeIcons: Record<string, React.ElementType> = {
  task: CheckCircle,
  social: Share2,
  file: FileText,
  notion: Database,
  music: Music,
};

const typeColors: Record<string, string> = {
  task: 'bg-green-500/20 text-green-400',
  social: 'bg-blue-500/20 text-blue-400',
  file: 'bg-yellow-500/20 text-yellow-400',
  notion: 'bg-purple-500/20 text-purple-400',
  music: 'bg-pink-500/20 text-pink-400',
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-raven-card rounded-xl border border-raven-border overflow-hidden">
      <div className="divide-y divide-raven-border">
        {activities.map((activity, index) => {
          const Icon = typeIcons[activity.type] || CheckCircle;
          const colorClass = typeColors[activity.type] || 'bg-gray-500/20 text-gray-400';
          
          return (
            <div key={index} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-raven-text truncate">{activity.title}</p>
                  <p className="text-xs text-raven-muted mt-1">{activity.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-raven-border">
        <button className="w-full text-center text-sm text-raven-orange hover:text-raven-teal transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  );
}
