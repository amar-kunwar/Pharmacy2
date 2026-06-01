import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, Trash2 } from 'lucide-react';

export default function AddMedicine({ session, showToast, editMedicine, editingId, clearEdit }) {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    batch_no: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    pack: '',
    size: '',
    scheme: '',
    rack_number: '',
    distributor_name: '',
    purchase_date: '',
    generic_name: '' // moved to end
  });


  useEffect(() => {
    if (editMedicine) {
      setFormData({
        name: editMedicine.name || '',
        manufacturer: editMedicine.manufacturer || '',
        batch_no: editMedicine.batch_no || '',
        expiry_date: editMedicine.expiry_date ? editMedicine.expiry_date.split('T')[0] : '',
        purchase_price: editMedicine.purchase_price !== null ? editMedicine.purchase_price.toString() : '',
        selling_price: editMedicine.selling_price !== null ? editMedicine.selling_price.toString() : '',
        quantity: editMedicine.quantity !== null ? editMedicine.quantity.toString() : '',
        pack: editMedicine.pack || '',
        size: editMedicine.size || '',
        scheme: editMedicine.scheme || '',
        rack_number: editMedicine.rack_number || '',
        distributor_name: editMedicine.distributor_name || '',
        purchase_date: editMedicine.purchase_date ? editMedicine.purchase_date.split('T')[0] : '',
        generic_name: editMedicine.generic_name || ''
      });
      setEditingId(editMedicine.id);
    }
  }, [editMedicine]);

  const loadMedicines = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) {
      console.error(error);
      showToast('Failed to load medicines', 'error');
    } else {
      setMedicines(data || []);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return showToast('Medicine name is required', 'error');
    const userId = session?.user?.id;
    if (!userId) return showToast('User not authenticated', 'error');
    const payload = {
      ...formData,
      user_id: userId,
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      selling_price: formData.selling_price ? Number(formData.selling_price) : null,
      quantity: formData.quantity ? Number(formData.quantity) : 0,
      expiry_date: formData.expiry_date ? (formData.expiry_date.length === 7 ? formData.expiry_date + '-01' : formData.expiry_date) : null,
      purchase_date: formData.purchase_date || null
    };
    if (editingId) payload.id = editingId;
    const { error } = await supabase.from('medicines').upsert(payload).select();
    if (error) {
      console.error(error);
      showToast('Error saving medicine', 'error');
    } else {
      showToast(editingId ? 'Medicine updated' : 'Medicine added', 'success');
    if (clearEdit) clearEdit();
    setFormData({
      name: '',
      manufacturer: '',
      batch_no: '',
      expiry_date: '',
      purchase_price: '',
      selling_price: '',
      quantity: '',
      pack: '',
      size: '',
      scheme: '',
      rack_number: '',
      distributor_name: '',
      purchase_date: '',
      generic_name: ''
    });
      loadMedicines();
    }
  };



  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) {
      console.error(error);
      showToast('Error deleting medicine', 'error');
    } else {
      showToast('Medicine deleted', 'success');
      loadMedicines();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      manufacturer: '',
      batch_no: '',
      expiry_date: '',
      purchase_price: '',
      selling_price: '',
      quantity: '',
      pack: '',
      size: '',
      scheme: '',
      rack_number: '',
      distributor_name: '',
      purchase_date: '',
      generic_name: ''
    });
    setEditingId(null);
  };

  return (
    <div className="medicines-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">💊</div>
          <h2>Add Medicines</h2>
        </div>
        <form onSubmit={handleSave} className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Medicine Name *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Medicine name" />
          </div>
          <div className="form-group">
            <label>Manufacturer</label>
            <input type="text" value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="Manufacturer" />
          </div>
          <div className="form-group">
            <label>Batch No</label>
            <input type="text" value={formData.batch_no} onChange={e => setFormData({ ...formData, batch_no: e.target.value })} placeholder="Batch number" />
          </div>
          <div className="form-group">
            <label>Expiry Date (MM/YYYY)</label>
            <input type="month" value={formData.expiry_date ? formData.expiry_date.substring(0, 7) : ''} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Purchase Price</label>
            <input type="number" step="0.01" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Selling Price</label>
            <input type="number" step="0.01" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Pack</label>
            <input type="text" value={formData.pack} onChange={e => setFormData({ ...formData, pack: e.target.value })} placeholder="Pack" />
          </div>
          <div className="form-group">
            <label>Size</label>
            <input type="text" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} placeholder="Size" />
          </div>
          <div className="form-group">
            <label>Scheme</label>
            <input type="text" value={formData.scheme} onChange={e => setFormData({ ...formData, scheme: e.target.value })} placeholder="Scheme" />
          </div>
          <div className="form-group">
            <label>Rack Number</label>
            <input type="text" value={formData.rack_number} onChange={e => setFormData({ ...formData, rack_number: e.target.value })} placeholder="Rack number" />
          </div>
          <div className="form-group">
            <label>Distributor Name</label>
            <input type="text" value={formData.distributor_name} onChange={e => setFormData({ ...formData, distributor_name: e.target.value })} placeholder="Distributor name" />
          </div>
          <div className="form-group">
            <label>Purchase Date</label>
            <input type="date" value={formData.purchase_date} onChange={e => setFormData({ ...formData, purchase_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Generic Name</label>
            <input type="text" value={formData.generic_name} onChange={e => setFormData({ ...formData, generic_name: e.target.value })} placeholder="Generic name" />
          </div>
          <div className="card-actions" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '16px' }}>
            {editingId && (
              <button 
                onClick={clearEdit}
                className="btn btn-outline"
                type="button"
              >Cancel</button>
            )}
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
