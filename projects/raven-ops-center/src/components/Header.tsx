import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';

export default function Header() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-raven-card border-b border-raven-border flex items-center justify-between px-6">
      {/* Logo and Search */}
      <div className="flex items-center gap-6 flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="Raven" 
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="text-xl font-bold gradient-text hidden md:block">Raven Ops</span>
        </div>
        
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-raven-muted" size={18} />
          <input
            type="text"
            placeholder="Search projects, tasks, files..."
            className="w-full bg-raven-bg border border-raven-border rounded-lg pl-10 pr-4 py-2 text-sm text-raven-text placeholder-raven-muted focus:outline-none focus:border-raven-orange transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-raven-muted text-sm">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-raven-muted hover:text-raven-text transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-raven-orange rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium font-sammy">Sammy</p>
            <p className="text-xs text-raven-muted">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-raven-teal to-raven-orange flex items-center justify-center text-white font-bold">
            S
          </div>
        </div>
      </div>
    </header>
  );
}
