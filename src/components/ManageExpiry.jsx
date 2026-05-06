import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, RotateCcw, Trash2, Edit } from 'lucide-react';

const PACK_TYPES = ['Syrup', 'Capsules', 'Tablets', 'Pcs', 'Item', 'Unit', 'Other'];

export default function ManageExpiry({ showToast }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([
    { id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '' }
  ]);
  const [saved, setSaved] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    const { data, error } = await supabase.from('expiries').select('*').eq('user_id', userId).order('saved_at', { ascending: false });
    if (error) return console.error(error);
    setSaved(data || []);
  };

  const addRow = () => setItems([...items, { id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '' }]);
  const removeRow = (id) => setItems(items.filter(it => it.id !== id));
  const updateRow = (id, field, value) => setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setItems([{ id: Date.now(), medicine_name: '', pack: 'Tablets', qty: 1, expiry: '', batch: '', mrp: '' }]);
    setEditingId(null);
  };

  const saveAll = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return showToast('User not authenticated', 'error');

    const validItems = items.filter(it => it.medicine_name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    // Prepare payloads
    const payloads = validItems.map(it => ({
      id: it.id && it.id.toString().startsWith('db_') ? it.id : undefined,
      date,
      medicine_name: it.medicine_name,
      pack: it.pack,
      qty: parseFloat(it.qty) || 0,
      expiry: it.expiry, // month picker value like 2026-05
      batch: it.batch,
      mrp: parseFloat(it.mrp) || 0,
      user_id: userId,
      saved_at: new Date().toISOString()
    }));

    // Insert or upsert items
    const { data, error } = await supabase.from('expiries').upsert(payloads).select();
    if (error) {
      console.error(error);
      return showToast('Error saving expiry data', 'error');
    }

    showToast('Expiry data saved', 'success');
    resetForm();
    loadSaved();
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setDate(row.date ? row.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setItems([{ id: row.id, medicine_name: row.medicine_name, pack: row.pack, qty: row.qty, expiry: row.expiry || '', batch: row.batch || '', mrp: row.mrp || '' }]);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('expiries').delete().eq('id', id);
    if (error) return showToast('Error deleting', 'error');
    showToast('Deleted', 'error');
    loadSaved();
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
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td><input type="text" value={it.medicine_name} onChange={(e) => updateRow(it.id, 'medicine_name', e.target.value)} placeholder="Medicine" /></td>
                    <td>
                      <select value={it.pack} onChange={(e) => updateRow(it.id, 'pack', e.target.value)}>
                        {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={it.qty} onChange={(e) => updateRow(it.id, 'qty', e.target.value)} style={{width:'70px'}} /></td>
                    <td><input type="month" value={it.expiry} onChange={(e) => updateRow(it.id, 'expiry', e.target.value)} /></td>
                    <td><input type="text" value={it.batch} onChange={(e) => updateRow(it.id, 'batch', e.target.value)} style={{width:'120px'}} /></td>
                    <td><input type="number" value={it.mrp} onChange={(e) => updateRow(it.id, 'mrp', e.target.value)} style={{width:'90px'}} /></td>
                    <td>
                      <button className="remove-row-btn" onClick={() => removeRow(it.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-actions" style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn btn-outline btn-sm" onClick={addRow}><Plus size={16} /> Add Item</button>
            <div style={{flex:1}} />
            <button className="btn btn-outline" onClick={resetForm}><RotateCcw size={16} /> Reset</button>
            <button className="btn btn-primary" onClick={saveAll}><Save size={16} /> Save</button>
          </div>
        </div>

        <div className="card" style={{marginTop:16}}>
          <div className="card-header"><h3>Saved Expiry Items</h3></div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.date ? row.date.split('T')[0] : ''}</td>
                    <td>{row.medicine_name}</td>
                    <td>{row.pack}</td>
                    <td>{row.qty}</td>
                    <td>{row.expiry ? row.expiry.replace('-', '/') : ''}</td>
                    <td>{row.batch}</td>
                    <td>₹{(row.mrp || 0).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-icon" onClick={() => handleEdit(row)} title="Edit"><Edit size={16} /></button>
                      <button className="btn btn-icon" onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {saved.length === 0 && (
                  <tr><td colSpan={9} style={{textAlign:'center'}}>No records</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
