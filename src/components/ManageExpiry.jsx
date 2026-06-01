import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, RotateCcw, Trash2, Edit, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const PACK_TYPES = ['Syrup', 'Capsules', 'Tablets', 'Pcs', 'Item', 'Unit', 'Other'];

export default function ManageExpiry({ showToast }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState([
    { id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '', distributor_id: '' }
  ]);
  const [saved, setSaved] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterDate, setFilterDate] = useState('');
  const [filterDistributor, setFilterDistributor] = useState('');

  useEffect(() => {
    loadDistributors();
    loadSaved();
  }, []);

  const loadDistributors = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    const { data } = await supabase.from('distributors').select('*').eq('user_id', userId).order('name', { ascending: true });
    if (data) setDistributors(data);
  };

  const loadSaved = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    const { data, error } = await supabase.from('expiries').select('*').eq('user_id', userId).order('saved_at', { ascending: false });
    if (error) return console.error(error);
    setSaved(data || []);
  };

  const addRow = () => setItems([...items, { id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '', distributor_id: '' }]);
  const removeRow = (id) => setItems(items.filter(it => it.id !== id));
  const updateRow = (id, field, value) => setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 7));
    setItems([{ id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '', distributor_id: '' }]);
    setEditingId(null);
  };

  const saveAll = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return showToast('User not authenticated', 'error');

    const validItems = items.filter(it => it.medicine_name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    const newItems = [];
    const updateItems = [];

    validItems.forEach(it => {
      const isUUID = typeof it.id === 'string' && it.id.length > 30;
      const payload = {
        date,
        medicine_name: it.medicine_name,
        pack: it.pack,
        qty: parseFloat(it.qty) || 0,
        expiry: it.expiry,
        batch: it.batch,
        mrp: parseFloat(it.mrp) || 0,
        distributor_id: it.distributor_id || null,
        user_id: userId,
        saved_at: new Date().toISOString()
      };

      if (isUUID) {
        payload.id = it.id;
        updateItems.push(payload);
      } else {
        newItems.push(payload);
      }
    });

    try {
      if (updateItems.length > 0) {
        const { error } = await supabase.from('expiries').upsert(updateItems);
        if (error) throw error;
      }
      if (newItems.length > 0) {
        const { error } = await supabase.from('expiries').insert(newItems);
        if (error) throw error;
      }
      showToast('Expiry data saved', 'success');
      resetForm();
      loadSaved();
    } catch (error) {
      console.error(error);
      showToast('Error saving expiry data', 'error');
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setDate(row.date ? row.date.slice(0, 7) : new Date().toISOString().slice(0, 7));
    setItems([{ 
      id: row.id, 
      medicine_name: row.medicine_name, 
      pack: row.pack, 
      qty: row.qty, 
      expiry: row.expiry || '', 
      batch: row.batch || '', 
      mrp: row.mrp || '',
      distributor_id: row.distributor_id || ''
    }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const { error } = await supabase.from('expiries').delete().eq('id', id);
    if (error) return showToast('Error deleting', 'error');
    showToast('Deleted', 'error');
    loadSaved();
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return saved.filter(row => {
      let matchDate = true;
      let matchDistributor = true;
      if (filterDate) {
        const rowDate = row.date ? row.date.slice(0, 7) : '';
        matchDate = rowDate === filterDate;
      }
      if (filterDistributor) {
        matchDistributor = row.distributor_id === filterDistributor;
      }
      return matchDate && matchDistributor;
    });
  }, [saved, filterDate, filterDistributor]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // If filter changes, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterDistributor]);

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) return showToast('No records to export', 'error');
    const headers = ['Date', 'Medicine', 'Pack', 'Qty', 'Expiry', 'Batch', 'MRP', 'Distributor'];
    const rows = filteredData.map(r => {
      const dist = distributors.find(d => d.id === r.distributor_id);
      return [
        r.date ? r.date.slice(0, 7) : '', 
        r.medicine_name || '', 
        r.pack || '', 
        r.qty || '', 
        r.expiry || '', 
        r.batch || '', 
        r.mrp || '',
        dist ? dist.name : ''
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvWithBom = '\uFEFF' + csv;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expiry-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Export successful', 'success');
  };

  return (
    <div className="manage-expiry-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🗓️</div>
          <h2>Manage Expiry</h2>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Month / Year</label>
            <input type="month" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Add Items</h3>
          </div>
          <div className="table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine Name</th>
                  <th>Pack</th>
                  <th>Qty</th>
                  <th>Expiry (MM-YYYY)</th>
                  <th>Batch No</th>
                  <th>MRP</th>
                  <th>Distributor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td><input type="text" value={it.medicine_name} onChange={(e) => updateRow(it.id, 'medicine_name', e.target.value)} placeholder="Medicine" /></td>
                    <td>
                      <select className="pack-select" value={it.pack} onChange={(e) => updateRow(it.id, 'pack', e.target.value)}>
                        {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={it.qty} onChange={(e) => updateRow(it.id, 'qty', e.target.value)} style={{width:'70px'}} /></td>
                    <td><input type="month" value={it.expiry} onChange={(e) => updateRow(it.id, 'expiry', e.target.value)} /></td>
                    <td><input type="text" value={it.batch} onChange={(e) => updateRow(it.id, 'batch', e.target.value)} style={{width:'120px'}} /></td>
                    <td><input type="number" value={it.mrp} onChange={(e) => updateRow(it.id, 'mrp', e.target.value)} style={{width:'90px'}} /></td>
                    <td>
                      <select className="pack-select" value={it.distributor_id || ''} onChange={(e) => updateRow(it.id, 'distributor_id', e.target.value)} style={{width:'150px'}}>
                        <option value="">Select</option>
                        {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="remove-row-btn" onClick={() => removeRow(it.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="add-item-row" style={{ padding: '0 20px 20px' }}>
            <button className="btn btn-outline btn-sm" onClick={addRow}>
              <Plus size={16} /> Add Item
            </button>
          </div>
          <div className="card-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', padding: '20px' }}>
            <button className="btn btn-outline" onClick={resetForm}>
              <RotateCcw size={18} /> Reset
            </button>
            <button className="btn btn-primary" onClick={saveAll}>
              <Save size={18} /> Save
            </button>
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3>Saved Expiry Items</h3>
            <div style={{display:'flex', gap: 12, alignItems: 'center'}}>
              <div className="form-group" style={{marginBottom: 0}}>
                <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} title="Filter by month" style={{padding:'6px', height:'36px'}} />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <select className="pack-select" value={filterDistributor} onChange={(e) => setFilterDistributor(e.target.value)}>
                  <option value="">All Distributors</option>
                  {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {(filterDate || filterDistributor) && (
                <button className="btn btn-icon" onClick={() => { setFilterDate(''); setFilterDistributor(''); }} title="Clear Filters" style={{height:'36px', padding:'0 8px'}}>✕</button>
              )}
              <button className="btn btn-secondary" onClick={exportToCSV} style={{height:'36px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <Download size={16} /> Export (Excel)
              </button>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Medicine</th>
                  <th>Pack</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Batch</th>
                  <th>MRP</th>
                  <th>Distributor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => {
                  const dist = distributors.find(d => d.id === row.distributor_id);
                  return (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td>{row.date ? row.date.slice(0, 7) : ''}</td>
                      <td>{row.medicine_name}</td>
                      <td>{row.pack}</td>
                      <td>{row.qty}</td>
                      <td>{row.expiry ? (() => {
                        const [y, m] = row.expiry.split('-');
                        return m ? `${m}/${y}` : row.expiry;
                      })() : ''}</td>
                      <td>{row.batch}</td>
                      <td>₹{(row.mrp || 0).toFixed(2)}</td>
                      <td>{dist ? dist.name : '-'}</td>
                      <td>
                        <div style={{display:'flex', gap:'8px'}}>
                          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit">
                            <Edit size={14} /> Edit
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paginatedData.length === 0 && (
                  <tr><td colSpan={10} style={{textAlign:'center'}}>No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:16, marginTop:16}}>
              <button 
                className="btn btn-icon" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                className="btn btn-icon" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
