import React from 'react';
import { supabase } from '../lib/supabase';
import { FilePlus, History, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ view, setView, collapsed, pharmacyName, userEmail }) {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">⚕</div>
        <div className="logo-text">
          <span className="logo-name">National Medical Store</span>
          <span className="logo-tagline">Medicine Billing</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${view === 'new-bill' ? 'active' : ''}`}
          onClick={() => setView('new-bill')}
        >
          <FilePlus size={18} className="nav-icon" />
          <span>New Bill</span>
        </button>
        <button 
          className={`nav-item ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          <History size={18} className="nav-icon" />
          <span>Bill History</span>
        </button>
        <button 
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          <Settings size={18} className="nav-icon" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="pharmacy-info">{pharmacyName || 'National Medical Store'}</div>
        <div className="user-email">{userEmail}</div>
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
