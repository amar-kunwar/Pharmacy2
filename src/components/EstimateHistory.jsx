import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Edit, Trash2, Search } from 'lucide-react';

export default function EstimateHistory({ estimates, onDelete, onPrint, onEdit }) {
  const [search, setSearch] = useState('');

  const filteredEstimates = estimates.filter(e => 
    e.customer.toLowerCase().includes(search.toLowerCase()) ||
    e.estimate_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this estimate permanently?')) return;
    const { error } = await supabase.from('estimates').delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      onDelete(id);
    }
  };

  const handlePrint = (estimate) => {
    onPrint(estimate);
  };

  return (
    <div className="history-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🗂️</div>
          <h2>Recent Estimates</h2>
          <div className="search-wrapper">
            <div className="medicine-search-bar">
              <input 
                type="text" 
                placeholder="Search by customer or estimate #" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={18} style={{position:'absolute', right:'12px', top:'10px', color:'var(--text-3)'}} />
            </div>
          </div>
        </div>

        <div className="history-list">
          {filteredEstimates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <p>No estimates found matching your search.</p>
            </div>
          ) : (
            filteredEstimates.map(e => (
              <div className="history-item" key={e.id}>
                <div className="hi-num">{e.estimate_no}</div>
                <div className="hi-name">{e.customer}</div>
                <div className="hi-date">
                  {new Date(e.date).toLocaleDateString('en-IN')}
                </div>
                <div className="hi-total">₹{(e.grand || 0).toFixed(2)}</div>
                <div className="hi-actions">
                  <button className="btn btn-sm btn-primary" title="Print" onClick={() => handlePrint(e)}>
                    <Printer size={14} /> Print
                  </button>
                  <button className="btn btn-sm btn-outline" title="Edit" onClick={() => onEdit(e)}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(e.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
