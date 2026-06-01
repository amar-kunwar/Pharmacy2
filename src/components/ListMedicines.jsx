import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit, Trash2 } from 'lucide-react';

export default function ListMedicines({ session, showToast, setView, setEditMedicine, setEditingId }) {
  const [medicines, setMedicines] = useState([]);

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

  const handleEdit = med => {
    // Set the medicine to edit in parent state and navigate to Add Medicines view
    if (setEditMedicine) setEditMedicine(med);
    if (setEditingId) setEditingId(med.id);
    if (setView) setView('add-medicines');
  };

  const handleDelete = async id => {
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

  return (
    <div className="medicines-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">💊</div>
          <h2>Medicine List</h2>
        </div>
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
                  <td>{m.expiry_date ? (() => {
                    const date = new Date(m.expiry_date);
                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                  })() : ''}</td>
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
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No medicines found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
