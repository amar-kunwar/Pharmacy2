import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Download, Trash2 } from 'lucide-react';

export default function Settings({ settings, onUpdate, showToast, onClearAll }) {
  const [formData, setFormData] = useState({
    pharmacyName: '',
    phone: '',
    address: '',
    gstin: '',
    dl: '',
    defaultGst: 12
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        pharmacyName: settings.pharmacyName || '',
        phone: settings.phone || '',
        address: settings.address || '',
        gstin: settings.gstin || '',
        dl: settings.dl || '',
        defaultGst: settings.defaultGst || 12
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('settings').upsert({
      user_id: user.id,
      pharmacy_name: formData.pharmacyName,
      phone: formData.phone,
      address: formData.address,
      gstin: formData.gstin,
      dl: formData.dl,
      default_gst: formData.defaultGst
    });

    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      onUpdate({...settings, ...formData});
    }
  };

  const handleExport = () => {
    // Logic for exporting data (can be refined to fetch all data from Supabase)
    showToast('Exporting data...', 'success');
  };

  const handleClear = async () => {
    if (!confirm('Are you sure? This will delete all bills from the cloud!')) return;
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('bills').delete().eq('user_id', user.id);
    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      onClearAll();
      showToast('All data cleared.', 'error');
    }
  };

  return (
    <div className="settings-view">
      <div className="card">
        <div className="card-header">
          <div className="card-icon">🏥</div>
          <h2>Pharmacy Profile</h2>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Pharmacy Name</label>
            <input 
              type="text" 
              value={formData.pharmacyName} 
              onChange={(e) => setFormData({...formData, pharmacyName: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input 
              type="text" 
              value={formData.phone} 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            />
          </div>
          <div className="form-group" style={{gridColumn:'1 / -1'}}>
            <label>Full Address</label>
            <textarea 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>GSTIN</label>
            <input 
              type="text" 
              value={formData.gstin} 
              onChange={(e) => setFormData({...formData, gstin: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Drug License (DL) No.</label>
            <input 
              type="text" 
              value={formData.dl} 
              onChange={(e) => setFormData({...formData, dl: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Default GST %</label>
            <input 
              type="number" 
              value={formData.defaultGst} 
              onChange={(e) => setFormData({...formData, defaultGst: e.target.value})} 
            />
          </div>
        </div>
        <div style={{marginTop:'24px'}}>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-icon">⚙️</div>
          <h2>Data Management</h2>
        </div>
        <div className="data-mgmt-row">
          <div className="data-mgmt-info">
            <strong>Export Backup</strong>
            <p>Download all your bills and settings as a JSON file.</p>
          </div>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={18} /> Export Data
          </button>
        </div>
        <div className="data-mgmt-row danger-row">
          <div className="data-mgmt-info">
            <strong>Clear All Records</strong>
            <p>Delete all your saved bills from the cloud permanently.</p>
          </div>
          <button className="btn btn-danger" onClick={handleClear}>
            <Trash2 size={18} /> Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}
