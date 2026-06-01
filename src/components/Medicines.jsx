import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, Trash2 } from 'lucide-react';

export default function ListMedicines({ session, showToast }) {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    batch_no: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    quantity: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (session) loadMedicines();
  }, [session]);

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
      // convert numeric fields
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      selling_price: formData.selling_price ? Number(formData.selling_price) : null,
      quantity: formData.quantity ? Number(formData.quantity) : 0,
      // ensure dates are in proper format
      expiry_date: formData.expiry_date || null
    };
    if (editingId) payload.id = editingId;
    const { error } = await supabase.from('medicines').upsert(payload).select();
    if (error) {
      console.error(error);
      showToast('Error saving medicine', 'error');
    } else {
      showToast(editingId ? 'Medicine updated' : 'Medicine added', 'success');
      setFormData({
        name: '',
        generic_name: '',
        manufacturer: '',
        batch_no: '',
        expiry_date: '',
        purchase_price: '',
        selling_price: '',
        quantity: ''
      });
      setEditingId(null);
      loadMedicines();
    }
  };

  const handleEdit = (med) => {
    setEditingId(med.id);
    setFormData({
      name: med.name || '',
      generic_name: med.generic_name || '',
      manufacturer: med.manufacturer || '',
      batch_no: med.batch_no || '',
      expiry_date: med.expiry_date ? med.expiry_date.split('T')[0] : '', // iso date to YYYY-MM-DD
      purchase_price: med.purchase_price !== null ? med.purchase_price.toString() : '',
      selling_price: med.selling_price !== null ? med.selling_price.toString() : '',
      quantity: med.quantity !== null ? med.quantity.toString() : ''
    });
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
      generic_name: '',
      manufacturer: '',
      batch_no: '',
      expiry_date: '',
      purchase_price: '',
      selling_price: '',
      quantity: ''
    });
    setEditingId(null);
  };

  return (
    <div className="medicines-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">💊</div>
          <h2>Medicine Inventory</h2>
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
            <label>Expiry Date</label>
            <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
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
          <div className="card-actions" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '16px' }}>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
            )}
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Sell ₹</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m, idx) => (
                <tr key={m.id}>
                  <td>{idx + 1}</td>
                  <td>{m.name}</td>
                  <td>{m.batch_no}</td>
                  <td>{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : ''}</td>
                  <td>{m.quantity}</td>
                  <td>{m.selling_price}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => handleEdit(m)} title="Edit">
                        <Edit size={14} /> Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {medicines.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No medicines found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
