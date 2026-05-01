import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Printer, Edit, Trash2, Search, Cloud } from 'lucide-react';

export default function History({ bills, settings, onDelete, onPrint, onEdit }) {
  const [search, setSearch] = useState('');

  const filteredBills = bills.filter(b => 
    b.customer.toLowerCase().includes(search.toLowerCase()) || 
    b.bill_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill permanently?')) return;
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) {
      alert('Error deleting: ' + error.message);
    } else {
      onDelete(id);
    }
  };

  const handlePrint = (bill) => {
    onPrint(bill);
  };

  const openCloudPDF = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="history-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🗂️</div>
          <h2>Recent Invoices</h2>
          <div className="search-wrapper">
            <div className="medicine-search-bar">
              <input 
                type="text" 
                placeholder="Search by patient or bill #" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={18} style={{position:'absolute', right:'12px', top:'10px', color:'var(--text-3)'}} />
            </div>
          </div>
        </div>

        <div className="history-list">
          {filteredBills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <p>No bills found matching your search.</p>
            </div>
          ) : (
            filteredBills.map(b => (
              <div className="history-item" key={b.id}>
                <div className="hi-num">{b.bill_no}</div>
                <div className="hi-name">{b.customer}</div>
                <div className="hi-date">
                  {new Date(b.date).toLocaleDateString('en-IN')}
                </div>
                <div className="hi-total">₹{(b.grand || 0).toFixed(2)}</div>
                <div className="hi-actions">
                  <button className="btn btn-sm btn-primary" title="Print" onClick={() => handlePrint(b)}>
                    <Printer size={14} /> Print
                  </button>
                  {b.pdf_url && (
                    <button className="btn btn-sm btn-info" title="View in Cloud" onClick={() => openCloudPDF(b.pdf_url)}>
                      <Cloud size={14} /> Cloud
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline" title="Edit" onClick={() => onEdit(b)}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="btn btn-sm btn-danger" title="Delete" onClick={() => handleDelete(b.id)}>
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

