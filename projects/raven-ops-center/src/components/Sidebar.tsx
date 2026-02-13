import React from 'react';
import { 
  Home, 
  Sun, 
  Music, 
  Kanban, 
  Share2, 
  Mail, 
  FolderOpen, 
  Activity,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'home', label: 'Home', icon: Home, section: 'MAIN' },
  { id: 'briefing', label: 'Morning Briefing', icon: Sun, section: 'MAIN' },
  { id: 'spotify', label: 'Spotify', icon: Music, section: 'MAIN' },
  { id: 'projects', label: 'Projects', icon: Kanban, section: 'WORK' },
  { id: 'social', label: 'Social Intelligence', icon: Share2, section: 'WORK' },
  { id: 'google', label: 'Google Ecosystem', icon: Mail, section: 'WORK' },
  { id: 'explorer', label: 'Workspace Explorer', icon: FolderOpen, section: 'TOOLS' },
  { id: 'activity', label: 'Activity Log', icon: Activity, section: 'TOOLS' },
];

const sections = ['MAIN', 'WORK', 'TOOLS'];

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-raven-card border-r border-raven-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-raven-border">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="Raven Logo" 
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <h1 className="font-bold text-lg font-raven">Raven</h1>
            <p className="text-xs text-raven-muted">Ops Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section) => (
          <div key={section} className="mb-6">
            <p className="px-6 text-xs font-semibold text-raven-muted uppercase tracking-wider mb-2">
              {section}
            </p>
            <div className="space-y-1">
              {menuItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onPageChange(item.id)}
                      className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-raven-orange/20 to-transparent text-raven-orange border-r-2 border-raven-orange'
                          : 'text-raven-muted hover:text-raven-text hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-raven-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-raven-muted hover:text-raven-text hover:bg-white/5 rounded-lg transition-all">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
