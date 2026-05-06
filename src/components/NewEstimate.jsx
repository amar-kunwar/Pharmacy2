import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, Printer, RotateCcw } from 'lucide-react';

const PACK_TYPES = ['Syrup', 'Capsules', 'Tablets', 'Pcs', 'Item', 'Unit', 'Other'];

export default function NewEstimate({ settings, editingEstimate, onSave, onPrint, showToast, onEstimateCounterUpdate, onCancelEdit }) {
  const [estimateData, setEstimateData] = useState({
    estimate_no: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    phone: '',
    sr_no: '',
  });

  const [items, setItems] = useState([
    { id: Date.now(), sr_no: 1, name: '', pack: 'Tablets', qty: 1, mrp: '', disc_percent: 0 }
  ]);

  useEffect(() => {
    if (editingEstimate) {
      setEstimateData({
        estimate_no: editingEstimate.estimate_no,
        date: editingEstimate.date,
        customer: editingEstimate.customer,
        phone: editingEstimate.phone,
        sr_no: editingEstimate.sr_no,
      });
      setItems(editingEstimate.items.map((it, idx) => ({ ...it, id: it.id || Date.now() + Math.random(), sr_no: idx + 1 })));
    } else if (settings) {
      setEstimateData(prev => ({ ...prev, estimate_no: `EST-${settings.estimateCounter + 1}`, sr_no: `SR-${settings.estimateCounter + 1}` }));
    }
  }, [settings, editingEstimate]);

  const addItem = () => {
    const newSrNo = items.length + 1;
    setItems([...items, { id: Date.now(), sr_no: newSrNo, name: '', pack: 'Tablets', qty: 1, mrp: '', disc_percent: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(it => it.id !== id).map((it, idx) => ({ ...it, sr_no: idx + 1 })));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDisc = 0;
    items.forEach(it => {
      const base = (parseFloat(it.qty) || 0) * (parseFloat(it.mrp) || 0);
      const d = base * (parseFloat(it.disc_percent) || 0) / 100;
      subtotal += base;
      totalDisc += d;
    });
    return { subtotal, discount: totalDisc, grand: subtotal - totalDisc };
  };

  const totals = calculateTotals();

  const handleSave = async (autoPrint = false) => {
    if (!estimateData.customer) return showToast('Please enter customer name', 'error');
    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    const finalEstimate = {
      ...(editingEstimate ? { id: editingEstimate.id } : {}),
      ...estimateData,
      ...totals,
      items: validItems,
      user_id: (await supabase.auth.getUser()).data.user.id,
      saved_at: editingEstimate ? editingEstimate.saved_at : new Date().toISOString()
    };

    const { data, error } = await supabase.from('estimates').upsert(finalEstimate).select().single();
    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      onSave(data);
      if (!editingEstimate) {
        const newCounter = settings.estimateCounter + 1;
        await supabase.from('settings').update({ estimate_counter: newCounter }).eq('user_id', finalEstimate.user_id);
        onEstimateCounterUpdate(newCounter);
      }

      if (autoPrint) {
        onPrint(data);
      }

      resetEstimate();
    }
  };

  const onSaveClick = async () => {
    const validItems = items.filter(it => it.name.trim() !== '');
    if (!estimateData.customer && validItems.length === 0) return showToast('Please enter customer name or medicines name', 'error');
    const shouldPrint = confirm('Do you want to print this estimate?');
    await handleSave(shouldPrint);
  };

  const onPrintClick = async () => {
    await handleSave(true);
  };

  const resetEstimate = () => {
    setEstimateData({
      ...estimateData,
      estimate_no: `EST-${settings.estimateCounter + 2}`,
      sr_no: `SR-${settings.estimateCounter + 2}`,
      customer: '',
      phone: '',
    });
    setItems([{ id: Date.now(), sr_no: 1, name: '', pack: 'Tablets', qty: 1, mrp: '', disc_percent: 0 }]);
  };

  const handlePrint = () => {
    if (!estimateData.customer) return showToast('Please enter customer name', 'error');
    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    onPrint({ ...estimateData, ...totals, items: validItems });
  };

  return (
    <div className="new-estimate-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">👤</div>
          <h2>Customer Details</h2>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Sr No</label>
            <input
              type="text"
              value={estimateData.sr_no}
              onChange={(e) => setEstimateData({...estimateData, sr_no: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Estimate Number</label>
            <input
              type="text"
              value={estimateData.estimate_no}
              onChange={(e) => setEstimateData({...estimateData, estimate_no: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={estimateData.date}
              onChange={(e) => setEstimateData({...estimateData, date: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Customer Name <span className="required">*</span></label>
            <input
              type="text"
              placeholder="Full name"
              value={estimateData.customer}
              onChange={(e) => setEstimateData({...estimateData, customer: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="text"
              placeholder="10-digit number"
              value={estimateData.phone}
              onChange={(e) => setEstimateData({...estimateData, phone: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-icon">💊</div>
          <h2>Medicine Items</h2>
        </div>
        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Medicine Name</th>
                <th>Pack</th>
                <th>QTY</th>
                <th>MRP</th>
                <th>Discount %</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const itemTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.mrp) || 0) * (1 - (parseFloat(it.disc_percent) || 0) / 100);
                return (
                  <tr key={it.id}>
                    <td>{it.sr_no}</td>
                    <td><input type="text" value={it.name} onChange={(e) => updateItem(it.id, 'name', e.target.value)} placeholder="Medicine" /></td>
                    <td>
                      <select className="pack-select" value={it.pack} onChange={(e) => updateItem(it.id, 'pack', e.target.value)}>
                        {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><input type="number" value={it.qty} onChange={(e) => updateItem(it.id, 'qty', e.target.value)} style={{width:'50px'}} /></td>
                    <td><input type="number" value={it.mrp} onChange={(e) => updateItem(it.id, 'mrp', e.target.value)} style={{width:'80px'}} /></td>
                    <td><input type="number" value={it.disc_percent} onChange={(e) => updateItem(it.id, 'disc_percent', e.target.value)} style={{width:'50px'}} /></td>
                    <td className="item-total">₹{itemTotal.toFixed(2)}</td>
                    <td><button className="remove-row-btn" onClick={() => removeItem(it.id)}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="add-item-row">
          <button className="btn btn-outline btn-sm" onClick={addItem}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="estimate-summary-container">
        <div className="card summary-card">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Discount</span>
            <span className="discount-text">-₹{totals.discount.toFixed(2)}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row grand-total-row">
            <span>Grand Total</span>
            <span id="sum-grand-total">₹{totals.grand.toFixed(2)}</span>
          </div>
          <div className="summary-actions">
            <button className="btn btn-primary" onClick={onSaveClick}>
              <Save size={18} /> Save Estimate
            </button>
            <button className="btn btn-secondary" onClick={onPrintClick}>
              <Printer size={18} /> Print
            </button>
            <button className="btn btn-outline" onClick={editingEstimate ? onCancelEdit : resetEstimate}>
              <RotateCcw size={18} /> {editingEstimate ? 'Cancel' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
