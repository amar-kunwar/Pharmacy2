import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Save, Printer, RotateCcw } from 'lucide-react';

const PACK_TYPES = ['Syrup', 'Capsules', 'Tablets', 'Pcs', 'Item', 'Unit', 'Other'];

export default function NewBill({ settings, editingBill, onSave, onPrint, showToast, onBillCounterUpdate, onCancelEdit }) {
  const [billData, setBillData] = useState({
    bill_no: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    phone: '',
    age: '',
    address: '',
    doctor: '',
    doctor_address: '',
    notes: 'Take care of your medicines properly before leaving the counter. Stay healthy, stay happy!',
  });

  const [items, setItems] = useState([
    { id: Date.now(), name: '', pack: 'Tablets', batch: '', expiry: '', qty: 1, price: '', disc: 0 }
  ]);

  useEffect(() => {
    if (editingBill) {
      setBillData({
        bill_no: editingBill.bill_no,
        date: editingBill.date,
        customer: editingBill.customer,
        phone: editingBill.phone,
        age: editingBill.age,
        address: editingBill.address,
        doctor: editingBill.doctor,
        doctor_address: editingBill.doctor_address,
        notes: editingBill.notes,
      });
      setItems(editingBill.items.map(it => ({ ...it, id: it.id || Date.now() + Math.random() })));
    } else if (settings) {
      setBillData(prev => ({ ...prev, bill_no: `NMS-${settings.billCounter + 1}` }));
    }
  }, [settings, editingBill]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), name: '', pack: 'Tablets', batch: '', expiry: '', qty: 1, price: '', disc: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDisc = 0;
    items.forEach(it => {
      const base = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
      const d = base * (parseFloat(it.disc) || 0) / 100;
      subtotal += base;
      totalDisc += d;
    });
    return { subtotal, discount: totalDisc, grand: subtotal - totalDisc };
  };

  const totals = calculateTotals();

  const handleSave = async (autoPrint = false) => {
    if (!billData.customer) return showToast('Please enter customer name', 'error');
    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    const finalBill = {
      ...(editingBill ? { id: editingBill.id } : {}),
      ...billData,
      ...totals,
      items: validItems,
      user_id: (await supabase.auth.getUser()).data.user.id,
      saved_at: editingBill ? editingBill.saved_at : new Date().toISOString()
    };

    const { data, error } = await supabase.from('bills').upsert(finalBill).select().single();
    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      onSave(data);
      if (!editingBill) {
        const newCounter = settings.billCounter + 1;
        await supabase.from('settings').update({ bill_counter: newCounter }).eq('user_id', finalBill.user_id);
        onBillCounterUpdate(newCounter);
      }
      
      if (autoPrint) {
        onPrint(data); // Print the saved data
      }
      
      resetBill();
    }
  };

  const onSaveClick = async () => {
    const validItems = items.filter(it => it.name.trim() !== '');
    if (!billData.customer) return showToast('Please enter Patient name', 'error');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');
    const shouldPrint = confirm('Do you want to print this bill?');
    await handleSave(shouldPrint);
  };

  const onPrintClick = async () => {
    await handleSave(true);
  };

  const resetBill = () => {
    setBillData({
      ...billData,
      bill_no: `NMS-${settings.billCounter + 2}`, // Anticipating next
      customer: '', phone: '', age: '', address: '', doctor: '', doctor_address: '', 
      notes: 'Take care of your medicines properly before leaving the counter. Stay healthy, stay happy!'
    });
    setItems([{ id: Date.now(), name: '', pack: 'Tablets', batch: '', expiry: '', qty: 1, price: '', disc: 0 }]);
  };

  const handlePrint = () => {
    if (!billData.customer) return showToast('Please enter customer name', 'error');
    const validItems = items.filter(it => it.name.trim() !== '');
    if (validItems.length === 0) return showToast('Add at least one medicine', 'error');

    onPrint({ ...billData, ...totals, items: validItems });
  };

  return (
    <div className="new-bill-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">👤</div>
          <h2>Customer & Doctor Details</h2>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Bill Number</label>
            <input 
              type="text" 
              value={billData.bill_no} 
              onChange={(e) => setBillData({...billData, bill_no: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              value={billData.date} 
              onChange={(e) => setBillData({...billData, date: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Patient Name <span className="required">*</span></label>
            <input 
              type="text" 
              placeholder="Full name" 
              value={billData.customer} 
              onChange={(e) => setBillData({...billData, customer: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              placeholder="10-digit number" 
              value={billData.phone} 
              onChange={(e) => setBillData({...billData, phone: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input 
              type="text" 
              placeholder="e.g. 25" 
              value={billData.age} 
              onChange={(e) => setBillData({...billData, age: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input 
              type="text" 
              placeholder="Customer address" 
              value={billData.address} 
              onChange={(e) => setBillData({...billData, address: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Doctor Name</label>
            <input 
              type="text" 
              placeholder="Doctor Name" 
              value={billData.doctor} 
              onChange={(e) => setBillData({...billData, doctor: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Doctor/Hospital Address</label>
            <input 
              type="text" 
              placeholder="Address" 
              value={billData.doctor_address} 
              onChange={(e) => setBillData({...billData, doctor_address: e.target.value})} 
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
                <th>#</th>
                <th>Medicine Name</th>
                <th>Pack</th>
                <th>Batch No</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Disc%</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const itemTotal = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0) * (1 - (parseFloat(it.disc) || 0) / 100);
                return (
                  <tr key={it.id}>
                    <td>{idx + 1}</td>
                    <td><input type="text" value={it.name} onChange={(e) => updateItem(it.id, 'name', e.target.value)} placeholder="Medicine" /></td>
                    <td>
                      <select className="pack-select" value={it.pack} onChange={(e) => updateItem(it.id, 'pack', e.target.value)}>
                        {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><input type="text" value={it.batch} onChange={(e) => updateItem(it.id, 'batch', e.target.value)} style={{width:'80px'}} /></td>
                    <td><input type="month" value={it.expiry} onChange={(e) => updateItem(it.id, 'expiry', e.target.value)} /></td>
                    <td><input type="number" value={it.qty} onChange={(e) => updateItem(it.id, 'qty', e.target.value)} style={{width:'50px'}} /></td>
                    <td><input type="number" value={it.price} onChange={(e) => updateItem(it.id, 'price', e.target.value)} style={{width:'80px'}} /></td>
                    <td><input type="number" value={it.disc} onChange={(e) => updateItem(it.id, 'disc', e.target.value)} style={{width:'50px'}} /></td>
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

      <div className="bill-summary-container">
        <div className="card">
          <div className="form-group">
            <label>Notes / Remarks</label>
            <textarea 
              placeholder="Additional information..." 
              value={billData.notes} 
              onChange={(e) => setBillData({...billData, notes: e.target.value})} 
            />
          </div>
        </div>
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
              <Save size={18} /> Save Bill
            </button>
            <button className="btn btn-secondary" onClick={onPrintClick}>
              <Printer size={18} /> Print
            </button>
            <button className="btn btn-outline" onClick={editingBill ? onCancelEdit : resetBill}>
              <RotateCcw size={18} /> {editingBill ? 'Cancel' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
