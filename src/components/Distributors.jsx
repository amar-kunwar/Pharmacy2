import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Trash2, Edit } from 'lucide-react';

export default function Distributors({ showToast }) {
  const [distributors, setDistributors] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;

    const { data, error } = await supabase.from('distributors').select('*').eq('user_id', userId).order('name', { ascending: true });
    if (error) return console.error(error);
    setDistributors(data || []);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return showToast('Name is required', 'error');

    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return showToast('User not authenticated', 'error');

    const payload = {
      ...formData,
      user_id: userId
    };

    if (editingId) {
      payload.id = editingId;
    }

    const { error } = await supabase.from('distributors').upsert(payload).select();
    if (error) return showToast('Error saving distributor', 'error');

    showToast('Distributor saved', 'success');
    setFormData({ name: '', phone: '', email: '', address: '' });
    setEditingId(null);
    loadDistributors();
  };

  const handleEdit = (dist) => {
    setEditingId(dist.id);
    setFormData({ name: dist.name, phone: dist.phone || '', email: dist.email || '', address: dist.address || '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this distributor?')) return;
    const { error } = await supabase.from('distributors').delete().eq('id', id);
    if (error) return showToast('Error deleting', 'error');
    showToast('Distributor deleted', 'error');
    loadDistributors();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setEditingId(null);
  };

  return (
    <div className="distributors-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🏢</div>
          <h2>Manage Distributors</h2>
        </div>

        <form onSubmit={handleSave} className="form-grid" style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Distributor Name" required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" rows="2" style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}></textarea>
          </div>
          <div className="card-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>

        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map((d, idx) => (
                <tr key={d.id}>
                  <td>{idx + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.phone}</td>
                  <td>{d.email}</td>
                  <td>{d.address}</td>
                  <td>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => handleEdit(d)} title="Edit">
                        <Edit size={14} /> Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(d.id)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {distributors.length === 0 && (
                <tr><td colSpan={6} style={{textAlign:'center'}}>No distributors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
