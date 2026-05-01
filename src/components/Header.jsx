import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

export default function Header({ view, toggleSidebar }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const labels = {
    'new-bill': 'New Bill',
    'history': 'Bill History',
    'settings': 'Settings'
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="breadcrumb">{labels[view]}</div>
      </div>

      <div className="header-right">
        <div className="header-time">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="header-date">
          {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
