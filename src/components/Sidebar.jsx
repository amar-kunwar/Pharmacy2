import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FilePlus, History, Settings, LogOut, Calculator, ChevronDown, ChevronRight, FileText, Pill, Package } from 'lucide-react';

export default function Sidebar({ view, setView, collapsed, pharmacyName, userEmail }) {
  const handleLogout = () => supabase.auth.signOut();
  
  const [expanded, setExpanded] = useState({
    bills: true,
    estimates: false,
    medicines: false
  });

  const toggleGroup = (group) => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  };

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
        {/* Bill Management */}
        <div className="nav-group">
          <button 
            className="nav-group-title" 
            onClick={() => toggleGroup('bills')}
          >
            <FileText size={18} className="nav-icon" />
            <span>Bill Management</span>
            {expanded.bills ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
          </button>
          {expanded.bills && (
            <div className="nav-submenu">
              <button 
                className={`nav-item sub-item ${view === 'new-bill' ? 'active' : ''}`}
                onClick={() => setView('new-bill')}
              >
                <FilePlus size={16} className="nav-icon" />
                <span>New Bill</span>
              </button>
              <button 
                className={`nav-item sub-item ${view === 'history' ? 'active' : ''}`}
                onClick={() => setView('history')}
              >
                <History size={16} className="nav-icon" />
                <span>Bill History</span>
              </button>
            </div>
          )}
        </div>

        {/* Estimate Management */}
        <div className="nav-group">
          <button 
            className="nav-group-title" 
            onClick={() => toggleGroup('estimates')}
          >
            <Calculator size={18} className="nav-icon" />
            <span>Estimate Mgmt</span>
            {expanded.estimates ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
          </button>
          {expanded.estimates && (
            <div className="nav-submenu">
              <button 
                className={`nav-item sub-item ${view === 'new-estimate' ? 'active' : ''}`}
                onClick={() => setView('new-estimate')}
              >
                <FilePlus size={16} className="nav-icon" />
                <span>New Estimate</span>
              </button>
              <button 
                className={`nav-item sub-item ${view === 'estimate-history' ? 'active' : ''}`}
                onClick={() => setView('estimate-history')}
              >
                <History size={16} className="nav-icon" />
                <span>Estimate History</span>
              </button>
            </div>
          )}
        </div>

        {/* Medicine Management */}
        <div className="nav-group">
          <button 
            className="nav-group-title" 
            onClick={() => toggleGroup('medicines')}
          >
            <Package size={18} className="nav-icon" />
            <span>Medicine Mgmt</span>
            {expanded.medicines ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
          </button>
          {expanded.medicines && (
            <div className="nav-submenu">
              <button 
                className={`nav-item sub-item ${view === 'list-medicines' ? 'active' : ''}`}
                onClick={() => setView('list-medicines')}
              >
                <Pill size={16} className="nav-icon" />
                <span>Medicines</span>
              </button>
              <button 
                className={`nav-item sub-item ${view === 'add-medicines' ? 'active' : ''}`}
                onClick={() => setView('add-medicines')}
              >
                <FilePlus size={16} className="nav-icon" />
                <span>Add Medicines</span>
              </button>
              <button 
                className={`nav-item sub-item ${view === 'manage-expiry' ? 'active' : ''}`}
                onClick={() => setView('manage-expiry')}
              >
                <History size={16} className="nav-icon" />
                <span>Manage Expiry</span>
              </button>
              <button 
                className={`nav-item sub-item ${view === 'distributors' ? 'active' : ''}`}
                onClick={() => setView('distributors')}
              >
                <History size={16} className="nav-icon" />
                <span>Distributors</span>
              </button>
            </div>
          )}
        </div>

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
