/* ===================================================
   script.js  –  PharmaBill Application Logic (Supabase)
   =================================================== */

// ─── State ─────────────────────────────────────────
let billItems   = [];
let billCounter = 1000;
let settings    = {};
let bills       = [];

// ─── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  startClock();

  // Event delegation for Bill History buttons
  document.getElementById('history-list').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const billNo = btn.dataset.bill;
    if (action === 'print')  printSavedBill(billNo);
    if (action === 'edit')   loadBillToEditor(billNo);
    if (action === 'delete') deleteBill(billNo);
  });
});

/**
 * Called by auth.js when user logs in
 */
async function initAppData() {
  if (!currentUser) return;
  
  // 1. Fetch settings
  const { data: setts, error: settErr } = await sb
    .from('settings')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();

  if (setts) {
    settings = {
      pharmacyName: setts.pharmacy_name,
      phone:        setts.phone,
      address:      setts.address,
      gstin:        setts.gstin,
      dl:           setts.dl,
      defaultGst:   setts.default_gst,
      billCounter:  setts.bill_counter
    };
    billCounter = setts.bill_counter;
  } else if (settErr && settErr.code === 'PGRST116') {
    // No settings found, create defaults
    const defaults = {
      user_id:       currentUser.id,
      pharmacy_name: 'My Pharmacy',
      bill_counter:  1000
    };
    await sb.from('settings').insert(defaults);
    settings = { pharmacyName: 'My Pharmacy', billCounter: 1000 };
    billCounter = 1000;
  }

  // 2. Fetch bills
  const { data: bData } = await sb
    .from('bills')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('saved_at', { ascending: false });

  bills = bData || [];

  // 3. UI Update
  applySettings();
  generateBillNumber();
  renderHistory();
  
  // Start with one row
  document.getElementById('items-body').innerHTML = '';
  billItems = [];
  addMedicineRow();
}

// ─── Clock ──────────────────────────────────────────
function startClock() {
  const tick = () => {
    const now  = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    document.getElementById('header-time').textContent = time;
    document.getElementById('header-date').textContent = date;
  };
  tick();
  setInterval(tick, 1000);
}

// ─── Sidebar ────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.querySelector('.main-content').classList.toggle('expanded');
}

// ─── Navigation ─────────────────────────────────────
const viewMap = {
  'new-bill':  { view: 'view-new-bill',  nav: 'nav-new-bill',  label: 'New Bill' },
  'history':   { view: 'view-history',   nav: 'nav-history',   label: 'Bill History' },
  'settings':  { view: 'view-settings',  nav: 'nav-settings',  label: 'Settings' },
};
function showView(key) {
  Object.values(viewMap).forEach(v => {
    document.getElementById(v.view).classList.remove('active');
    document.getElementById(v.nav).classList.remove('active');
  });
  const m = viewMap[key];
  document.getElementById(m.view).classList.add('active');
  document.getElementById(m.nav).classList.add('active');
  document.getElementById('breadcrumb').textContent = m.label;
  if (key === 'history') renderHistory();
  if (key === 'settings') loadSettings();
}

// ─── Bill Number / Date ──────────────────────────────
async function generateBillNumber() {
  billCounter++;
  document.getElementById('bill-number').value = `NMS-${billCounter}`;
  
  // Update counter in DB
  if (currentUser) {
    await sb.from('settings')
      .update({ bill_counter: billCounter })
      .eq('user_id', currentUser.id);
  }
}
function initDate() {
  const d = new Date();
  const iso = d.toISOString().split('T')[0];
  document.getElementById('bill-date').value = iso;
}

// ─── Medicine Row ────────────────────────────────────
const PACK_TYPES = ['Syrup', 'Capsules', 'Tablets', 'Pcs', 'Item', 'Unit', 'Other'];

function addMedicineRow(med = null) {
  const id  = uid();
  billItems.push({ id });
  const idx = billItems.length;

  const packOptions = PACK_TYPES.map(p =>
    `<option value="${p}" ${med && med.pack === p ? 'selected' : ''}>${p}</option>`
  ).join('');

  const tr = document.createElement('tr');
  tr.id = `row-${id}`;

  tr.innerHTML = `
    <td>${idx}</td>
    <td><input type="text"   id="name-${id}"   placeholder="Medicine name" /></td>
    <td><select id="pack-${id}" class="pack-select">${packOptions}</select></td>
    <td><input type="text"   id="batch-${id}"  placeholder="Batch no." style="width:88px" /></td>
    <td><input type="date"   id="expiry-${id}" style="width:130px" /></td>
    <td><input type="number" id="qty-${id}"    value="1"  min="1"   style="width:58px" /></td>
    <td><input type="number" id="price-${id}"  value=""   min="0"   step="0.01" style="width:88px" placeholder="0.00" /></td>
    <td><input type="number" id="disc-${id}"   value="0"  min="0"   max="100" style="width:58px" /></td>
    <td><span  id="total-${id}" class="item-total">₹0.00</span></td>
    <td><button class="remove-row-btn" title="Remove">✕</button></td>`;

  document.getElementById('items-body').appendChild(tr);

  if (med) {
    document.getElementById(`name-${id}`).value   = med.name   || '';
    document.getElementById(`price-${id}`).value  = med.price  || '';
    document.getElementById(`expiry-${id}`).value = med.expiry || '';
    document.getElementById(`batch-${id}`).value  = med.batch  || '';
    document.getElementById(`qty-${id}`).value    = med.qty    || 1;
    document.getElementById(`disc-${id}`).value   = med.disc   || 0;
    if (med.pack) document.getElementById(`pack-${id}`).value = med.pack;
  }

  ['qty', 'price', 'disc'].forEach(field => {
    document.getElementById(`${field}-${id}`).addEventListener('input', () => recalcRow(id));
  });
  tr.querySelector('.remove-row-btn').addEventListener('click', () => removeRow(id));

  recalcRow(id);
}

function removeRow(id) {
  const tr = document.getElementById(`row-${id}`);
  if (tr) tr.remove();
  billItems = billItems.filter(i => i.id !== id);
  renumberRows();
  recalcSummary();
}

function renumberRows() {
  const rows = document.querySelectorAll('#items-body tr');
  rows.forEach((r, i) => { r.cells[0].textContent = i + 1; });
}

function recalcRow(id) {
  const qty   = parseFloat(document.getElementById(`qty-${id}`)?.value)   || 0;
  const price = parseFloat(document.getElementById(`price-${id}`)?.value) || 0;
  const disc  = parseFloat(document.getElementById(`disc-${id}`)?.value)  || 0;

  const base    = qty * price;
  const discAmt = base * disc / 100;
  const total   = base - discAmt;

  const el = document.getElementById('total-' + id);
  if (el) el.textContent = '₹' + total.toFixed(2);
  recalcSummary();
}

function recalcSummary() {
  let subtotal = 0, totalDisc = 0;
  const rows = document.querySelectorAll('#items-body tr');
  rows.forEach(tr => {
    const rowId = tr.id.replace('row-', '');
    const qty   = parseFloat(document.getElementById(`qty-${rowId}`)?.value)   || 0;
    const price = parseFloat(document.getElementById(`price-${rowId}`)?.value) || 0;
    const disc  = parseFloat(document.getElementById(`disc-${rowId}`)?.value)  || 0;
    const base    = qty * price;
    const discAmt = base * disc / 100;
    subtotal  += base;
    totalDisc += discAmt;
  });
  const grand = subtotal - totalDisc;
  document.getElementById('sum-subtotal').textContent    = '₹' + subtotal.toFixed(2);
  document.getElementById('sum-discount').textContent    = '-₹' + totalDisc.toFixed(2);
  document.getElementById('sum-grand-total').textContent = '₹' + grand.toFixed(2);
}


// ─── Reset Bill ──────────────────────────────────────
function resetBill() {
  if (!confirm('Reset the current bill? All entered data will be cleared.')) return;
  document.getElementById('customer-name').value    = '';
  document.getElementById('customer-phone').value   = '';
  document.getElementById('customer-age').value     = '';
  document.getElementById('customer-address').value = '';
  document.getElementById('doctor-name').value      = '';
  document.getElementById('doctor-address').value   = '';
  document.getElementById('bill-notes').value       = '';
  initDate();
  generateBillNumber();
  document.getElementById('items-body').innerHTML = '';
  billItems = [];
  addMedicineRow();
  recalcSummary();
}

// ─── Collect Bill Data ───────────────────────────────
function collectBillData() {
  const rows = document.querySelectorAll('#items-body tr');
  const items = [];
  rows.forEach(tr => {
    const id     = tr.id.replace('row-', '');
    const name   = document.getElementById(`name-${id}`)?.value?.trim();
    const pack   = document.getElementById(`pack-${id}`)?.value   || '';
    const qty    = parseFloat(document.getElementById(`qty-${id}`)?.value)   || 0;
    const price  = parseFloat(document.getElementById(`price-${id}`)?.value) || 0;
    const disc   = parseFloat(document.getElementById(`disc-${id}`)?.value)  || 0;
    const batch  = document.getElementById(`batch-${id}`)?.value  || '';
    const expiry = document.getElementById(`expiry-${id}`)?.value || '';
    if (name) items.push({ name, pack, qty, price, disc, batch, expiry });
  });
  return {
    bill_no:        document.getElementById('bill-number').value,
    date:           document.getElementById('bill-date').value,
    customer:       document.getElementById('customer-name').value.trim(),
    phone:          document.getElementById('customer-phone').value,
    age:            document.getElementById('customer-age').value,
    address:        document.getElementById('customer-address').value,
    doctor:         document.getElementById('doctor-name').value,
    doctor_address: document.getElementById('doctor-address').value,
    notes:          document.getElementById('bill-notes').value,
    items,
  };
}

function calcTotals(items) {
  let subtotal = 0, disc = 0;
  items.forEach(it => {
    const base = it.qty * it.price;
    const d    = base * it.disc / 100;
    subtotal += base;
    disc     += d;
  });
  return { subtotal, discount: disc, grand: subtotal - disc };
}

// ─── Save Bill ───────────────────────────────────────
async function saveBill() {
  if (!currentUser) return;
  const data = collectBillData();
  if (!data.customer) { showToast('Please enter a customer name.', 'error'); return; }
  if (!data.items.length) { showToast('Add at least one medicine item.', 'error'); return; }
  
  const totals = calcTotals(data.items);
  const bill = { 
    ...data, 
    ...totals, 
    user_id: currentUser.id,
    saved_at: new Date().toISOString() 
  };
  
  const { data: saved, error } = await sb
    .from('bills')
    .insert(bill)
    .select()
    .single();

  if (error) {
    showToast('Error saving bill: ' + error.message, 'error');
  } else {
    bills.unshift(saved);
    showToast('Bill saved successfully! ✓', 'success');
    renderHistory();
    // Don't reset everything, just increment number for next one
    generateBillNumber();
  }
}

// ─── Print Bill ──────────────────────────────────────
function printBill() {
  const data = collectBillData();
  if (!data.customer) { showToast('Please enter a customer name to print.', 'error'); return; }
  if (!data.items.length) { showToast('Add at least one medicine item.', 'error'); return; }
  
  // Mock a structure expected by renderPrintArea
  const totals = calcTotals(data.items);
  renderPrintArea({ ...data, ...totals });
  window.print();
}

function printSavedBill(billNo) {
  const bill = bills.find(b => b.bill_no === billNo);
  if (!bill) return;
  renderPrintArea(bill);
  window.print();
}

function renderPrintArea(data) {
  const s = settings;
  const pa = document.getElementById('print-area');

  const rows = data.items.map((it, i) => {
    const base    = it.qty * it.price;
    const discAmt = base * (it.disc || 0) / 100;
    const total   = base - discAmt;
    const expiryFmt = it.expiry
      ? new Date(it.expiry).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      : '-';
    return `<tr>
      <td>${i + 1}</td>
      <td>${it.name}</td>
      <td>${it.pack || '-'}</td>
      <td>${it.batch || '-'}</td>
      <td>${expiryFmt}</td>
      <td>${it.qty}</td>
      <td>₹${parseFloat(it.price).toFixed(2)}</td>
      <td>${it.disc || 0}%</td>
      <td><strong>₹${total.toFixed(2)}</strong></td>
    </tr>`;
  }).join('');

  pa.innerHTML = `
    <div class="print-header">
      <h1>${s.pharmacyName || 'PharmaBill'}</h1>
      <p>${s.address || ''}</p>
      ${s.phone ? `<p>📞 ${s.phone}</p>` : ''}
      ${s.gstin ? `<p>GSTIN: ${s.gstin}</p>` : ''}
      ${s.dl    ? `<p>Drug Lic: ${s.dl}</p>` : ''}
    </div>

    <div class="print-meta">
      <div class="print-meta-block">
        <p><strong>Bill No:</strong> ${data.bill_no}</p>
        <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</p>
        ${data.doctor        ? `<p><strong>Doctor:</strong> ${data.doctor}</p>` : ''}
        ${data.doctor_address ? `<p><strong>Hospital:</strong> ${data.doctor_address}</p>` : ''}
      </div>
      <div class="print-meta-block">
        <p><strong>Patient:</strong> ${data.customer}</p>
        ${data.phone   ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        ${data.age     ? `<p><strong>Age:</strong> ${data.age} yrs</p>` : ''}
        ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ''}
      </div>
    </div>

    <table class="print-table">
      <thead>
        <tr>
          <th>#</th><th>Medicine</th><th>Pack</th><th>Batch</th><th>Expiry</th>
          <th>Qty</th><th>MRP</th><th>Disc</th><th>Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="print-summary">
      <div class="print-summary-row"><span>Subtotal</span><span>₹${(data.subtotal || 0).toFixed(2)}</span></div>
      <div class="print-summary-row"><span>Discount</span><span>-₹${(data.discount || 0).toFixed(2)}</span></div>
      <div class="print-summary-total"><span>Grand Total</span><span>₹${(data.grand || 0).toFixed(2)}</span></div>
    </div>

    ${data.notes ? `<div class="print-notes"><strong>Notes:</strong> ${data.notes}</div>` : ''}

    <div class="print-signature">
      <div class="print-sign-box"><div class="print-sign-line">Patient / Guardian Signature</div></div>
      <div class="print-sign-box"><div class="print-sign-line">Pharmacist Signature</div></div>
    </div>

    <div class="print-footer">
      <p>Thank you for choosing ${s.pharmacyName || 'PharmaBill'}. Get well soon!</p>
      <p>This is a computer-generated bill. Generated by PharmaBill.</p>
    </div>`;
}

// ─── History ─────────────────────────────────────────
async function renderHistory() {
  const q      = (document.getElementById('history-search')?.value || '').toLowerCase();
  const list   = document.getElementById('history-list');
  
  const filtered = bills.filter(b =>
    b.customer.toLowerCase().includes(q) || b.bill_no.toLowerCase().includes(q));

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🗂️</div><p>No bills found.</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(b => {
    const safeNo = b.bill_no.replace(/"/g, '&quot;');
    return `
    <div class="history-item">
      <div class="hi-num">${b.bill_no}</div>
      <div class="hi-name">${b.customer}</div>
      <div class="hi-date">${new Date(b.date).toLocaleDateString('en-IN')}</div>
      <div class="hi-total">₹${(b.grand || 0).toFixed(2)}</div>
      <div class="hi-actions">
        <button class="btn btn-sm btn-primary" data-action="print" data-bill="${safeNo}">🖸 Print</button>
        <button class="btn btn-sm btn-outline" data-action="edit"  data-bill="${safeNo}">✏️ Edit</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-bill="${safeNo}">🗑</button>
      </div>
    </div>`;
  }).join('');
}

async function deleteBill(billNo) {
  if (!confirm('Delete this bill permanently?')) return;
  
  const { error } = await sb
    .from('bills')
    .delete()
    .eq('bill_no', billNo)
    .eq('user_id', currentUser.id);

  if (error) {
    showToast('Error deleting bill: ' + error.message, 'error');
  } else {
    bills = bills.filter(b => b.bill_no !== billNo);
    renderHistory();
    showToast('Bill deleted.', 'error');
  }
}

function loadBillToEditor(billNo) {
  const bill = bills.find(b => b.bill_no === billNo);
  if (!bill) return;

  document.getElementById('customer-name').value    = bill.customer      || '';
  document.getElementById('customer-phone').value   = bill.phone         || '';
  document.getElementById('customer-age').value     = bill.age           || '';
  document.getElementById('customer-address').value = bill.address       || '';
  document.getElementById('doctor-name').value      = bill.doctor        || '';
  document.getElementById('doctor-address').value   = bill.doctor_address || '';
  document.getElementById('bill-notes').value       = bill.notes         || '';
  document.getElementById('bill-date').value        = bill.date;
  document.getElementById('bill-number').value      = bill.bill_no;

  document.getElementById('items-body').innerHTML = '';
  billItems = [];
  bill.items.forEach(it => {
    addMedicineRow(it);
    const rows = document.querySelectorAll('#items-body tr');
    const tr   = rows[rows.length - 1];
    const id   = tr.id.replace('row-', '');
    document.getElementById(`qty-${id}`).value    = it.qty;
    document.getElementById(`disc-${id}`).value   = it.disc;
    document.getElementById(`batch-${id}`).value  = it.batch  || '';
    document.getElementById(`expiry-${id}`).value = it.expiry || '';
  });

  showView('new-bill');
  showToast(`Bill ${billNo} loaded for editing.`, 'success');
}


// ─── Settings ────────────────────────────────────────
function loadSettings() {
  const s = settings;
  document.getElementById('setting-pharmacy-name').value    = s.pharmacyName || '';
  document.getElementById('setting-pharmacy-phone').value   = s.phone        || '';
  document.getElementById('setting-pharmacy-address').value = s.address      || '';
  document.getElementById('setting-pharmacy-gstin').value   = s.gstin        || '';
  document.getElementById('setting-pharmacy-dl').value      = s.dl           || '';
  document.getElementById('setting-default-gst').value      = s.defaultGst   !== undefined ? s.defaultGst : 12;
}

async function saveSettings() {
  if (!currentUser) return;
  
  settings.pharmacyName = document.getElementById('setting-pharmacy-name').value.trim();
  settings.phone        = document.getElementById('setting-pharmacy-phone').value.trim();
  settings.address      = document.getElementById('setting-pharmacy-address').value.trim();
  settings.gstin        = document.getElementById('setting-pharmacy-gstin').value.trim();
  settings.dl           = document.getElementById('setting-pharmacy-dl').value.trim();
  settings.defaultGst   = parseFloat(document.getElementById('setting-default-gst').value) || 12;

  const { error } = await sb
    .from('settings')
    .upsert({
      user_id:       currentUser.id,
      pharmacy_name: settings.pharmacyName,
      phone:         settings.phone,
      address:       settings.address,
      gstin:         settings.gstin,
      dl:            settings.dl,
      default_gst:   settings.defaultGst
    });

  if (error) {
    showToast('Error saving settings: ' + error.message, 'error');
  } else {
    applySettings();
    showToast('Settings saved. ✓', 'success');
  }
}

function applySettings() {
  const name = settings.pharmacyName || 'My Pharmacy';
  document.getElementById('sidebar-pharmacy-name').textContent = name;
}

// ─── Data Management ─────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify({ bills, settings }, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `pharmabill-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

async function clearAllData() {
  if (!confirm('Are you sure? This will delete ALL bills in the database!')) return;
  
  const { error } = await sb
    .from('bills')
    .delete()
    .eq('user_id', currentUser.id);

  if (error) {
    showToast('Error clearing data: ' + error.message, 'error');
  } else {
    bills = [];
    renderHistory();
    resetBill();
    showToast('All bills cleared.', 'error');
  }
}

// ─── Toast ───────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

// ─── Utility ─────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
