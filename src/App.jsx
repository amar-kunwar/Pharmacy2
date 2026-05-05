import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { uploadBillPDF } from './lib/storage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NewBill from './components/NewBill';
import NewEstimate from './components/NewEstimate';
import History from './components/History';
import EstimateHistory from './components/EstimateHistory';
import Settings from './components/Settings';
import Toast from './components/Toast';
import PrintTemplate from './components/PrintTemplate';

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('new-bill');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [userSettings, setUserSettings] = useState({
    pharmacyName: 'National Medical Store',
    phone: '7303292203',
    address: 'A block, Thokar No -7, Jamia Nagar, Okhla New Delhi 110025',
    billCounter: 1000,
    estimateCounter: 1000
  });
  const [bills, setBills] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editingEstimate, setEditingEstimate] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUserSettings(null);
        setBills([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      initAppData();
    }
  }, [session]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3200);
  };

  async function initAppData() {
    // Fetch settings
    const { data: setts, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (setts) {
      setUserSettings({
        pharmacyName: setts.pharmacy_name,
        phone: setts.phone,
        address: setts.address,
        gstin: setts.gstin,
        dl: setts.dl,
        defaultGst: setts.default_gst,
        billCounter: setts.bill_counter,
        estimateCounter: setts.estimate_counter || 1000
      });
    } else if (error && error.code === 'PGRST116') {
      const defaults = {
        user_id: session.user.id,
        pharmacy_name: 'National Medical Store',
        phone: '7303292203',
        address: 'A block, Thokar No -7, Jamia Nagar, Okhla New Delhi 110025',
        bill_counter: 1000,
        estimate_counter: 1000
      };
      await supabase.from('settings').insert(defaults);
      setUserSettings({ 
        pharmacyName: 'National Medical Store', 
        phone: '7303292203',
        address: 'Jamia Nagar Okhla New Delhi',
        billCounter: 1000,
        estimateCounter: 1000
      });
    }

    // Fetch bills
    const { data: bData } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', session.user.id)
      .order('saved_at', { ascending: false });

    setBills(bData || []);

    // Fetch estimates
    const { data: eData } = await supabase
      .from('estimates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('saved_at', { ascending: false });

    setEstimates(eData || []);
  }

  const handleSaveBill = async (newBill) => {
    if (editingBill) {
      setBills(bills.map(b => b.id === newBill.id ? newBill : b));
      setEditingBill(null);
    } else {
      setBills([newBill, ...bills]);
    }
    
    showToast('Bill saved. Generating PDF for cloud storage...', 'info');
    
    // Set print data to render PrintTemplate for PDF capture
    // We clear it first to ensure a fresh render even if the data is similar
    setPrintData(null);
    setTimeout(() => {
      setPrintData(newBill);
    }, 50);
    
    // Wait for render, then upload PDF
    setTimeout(async () => {
      const pdfUrl = await uploadBillPDF(newBill);
      if (pdfUrl) {
        showToast('Bill & PDF stored in cloud!', 'success');
        setBills(prev => prev.map(b => b.id === newBill.id ? { ...b, pdf_url: pdfUrl } : b));
      } else {
        showToast('Bill saved, but cloud storage failed.', 'warning');
      }
      
      // ONLY clear printData if we are NOT in the middle of a printing flow
      // We check if the current printData is the one we just saved
      setPrintData(prev => (prev && prev.id === newBill.id && !window.matchMedia('print').matches) ? null : prev);
    }, 2000);
  };

  const handlePrintBill = (data) => {
    setPrintData(null);
    setTimeout(() => {
      setPrintData(data);
      setTimeout(() => {
        window.print();
        // Background upload after print dialog opens
        setTimeout(() => uploadBillPDF(data), 1000);
      }, 500);
    }, 50);
  };

  const handleSaveEstimate = async (newEstimate) => {
    if (editingEstimate) {
      setEstimates(estimates.map(e => e.id === newEstimate.id ? newEstimate : e));
      setEditingEstimate(null);
    } else {
      setEstimates([newEstimate, ...estimates]);
    }
    
    showToast('Estimate saved successfully!', 'success');
  };

  const handlePrintEstimate = (data) => {
    setPrintData(null);
    setTimeout(() => {
      setPrintData(data);
      setTimeout(() => {
        window.print();
      }, 500);
    }, 50);
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        view={view} 
        setView={setView} 
        collapsed={sidebarCollapsed} 
        pharmacyName={userSettings?.pharmacyName}
        userEmail={session.user.email}
      />
      
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Header 
          view={view} 
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <div className={`view ${view === 'new-bill' ? 'active' : ''}`}>
          {view === 'new-bill' && (
            <NewBill 
              settings={userSettings} 
              editingBill={editingBill}
              onSave={handleSaveBill}
              onPrint={handlePrintBill}
              showToast={showToast}
              onBillCounterUpdate={(count) => setUserSettings({...userSettings, billCounter: count})}
              onCancelEdit={() => {
                setEditingBill(null);
                setView('history');
              }}
            />
          )}
        </div>

        <div className={`view ${view === 'new-estimate' ? 'active' : ''}`}>
          {view === 'new-estimate' && (
            <NewEstimate 
              settings={userSettings} 
              editingEstimate={editingEstimate}
              onSave={handleSaveEstimate}
              onPrint={handlePrintEstimate}
              showToast={showToast}
              onEstimateCounterUpdate={(count) => setUserSettings({...userSettings, estimateCounter: count})}
              onCancelEdit={() => {
                setEditingEstimate(null);
                setView('history');
              }}
            />
          )}
        </div>

        <div className={`view ${view === 'history' ? 'active' : ''}`}>
          {view === 'history' && (
            <History 
              bills={bills} 
              settings={userSettings}
              onDelete={(id) => {
                setBills(bills.filter(b => b.id !== id));
                showToast('Bill deleted.', 'error');
              }}
              onPrint={handlePrintBill}
              onEdit={(bill) => {
                setEditingBill(bill);
                setView('new-bill');
              }} 
            />
          )}
        </div>

        <div className={`view ${view === 'estimate-history' ? 'active' : ''}`}>
          {view === 'estimate-history' && (
            <EstimateHistory
              estimates={estimates}
              onDelete={(id) => {
                setEstimates(estimates.filter(e => e.id !== id));
                showToast('Estimate deleted.', 'error');
              }}
              onPrint={handlePrintEstimate}
              onEdit={(estimate) => {
                setEditingEstimate(estimate);
                setView('new-estimate');
              }}
            />
          )}
        </div>

        <div className={`view ${view === 'settings' ? 'active' : ''}`}>
          {view === 'settings' && (
            <Settings 
              settings={userSettings} 
              onUpdate={(newSetts) => {
                setUserSettings(newSetts);
                showToast('Settings saved.', 'success');
              }}
              showToast={showToast}
              onClearAll={() => setBills([])}
            />
          )}
        </div>
      </main>

      <Toast {...toast} />
      {printData && (
        <div className="print-template-container">
           <PrintTemplate data={printData} settings={userSettings} />
        </div>
      )}
    </div>
  );
}

