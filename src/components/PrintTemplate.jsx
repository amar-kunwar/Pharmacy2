import React from 'react';

// Helper function to convert number to words (Indian Style)
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
  return str;
}

export default function PrintTemplate({ data, settings }) {
  if (!data) return null;

  const netAmount = data.grand || 0;
  const netAmountWords = numberToWords(Math.floor(netAmount));

  return (
    <div id="print-area" className="print-area">
      <div className="print-type">CASH MEMO / INVOICE</div>
      
      <div className="print-header">
        <h1>National Medical Store</h1>
        <p>DL No. - RLF21DL2024001871, RLF20DL2024001861</p>
        <p>Jamia Nagar Okhla New Delhi, Mobile Number 7303292203</p>
        {settings?.gstin && (
          <div className="print-licenses">
            <span>GSTIN: {settings.gstin}</span>
          </div>
        )}
      </div>

      <div className="print-meta-grid">
        <div className="meta-left">
          <div className="meta-row"><strong>Patient Name:</strong> {data.customer}</div>
          {data.phone && <div className="meta-row"><strong>Phone:</strong> {data.phone}</div>}
          {data.age && <div className="meta-row"><strong>Age/Sex:</strong> {data.age}</div>}
          {data.address && <div className="meta-row"><strong>Address:</strong> {data.address}</div>}
        </div>
        <div className="meta-right">
          <div className="meta-row"><strong>Bill No:</strong> {data.bill_no}</div>
          <div className="meta-row"><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div>
          {data.doctor && <div className="meta-row"><strong>Doctor Name:</strong> {data.doctor}</div>}
          {data.doctor_address && <div className="meta-row"><strong>Doctor Address:</strong> {data.doctor_address}</div>}
        </div>
      </div>

      <table className="print-main-table">
        <thead>
          <tr>
            <th style={{width: '50px'}}>Sr No</th>
            <th>Medicine Name</th>
            <th>Pack</th>
            <th>Batch</th>
            <th>Expiry</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Disc%</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => {
            const base = (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
            const total = base * (1 - (parseFloat(it.disc) || 0) / 100);
            return (
              <tr key={i}>
                <td className="text-center">{i + 1}</td>
                <td><strong>{it.name}</strong></td>
                <td className="text-center">{it.pack || '-'}</td>
                <td className="text-center">{it.batch || '-'}</td>
                <td className="text-center">{it.expiry ? new Date(it.expiry).toLocaleDateString('en-IN', { month:'short', year:'2-digit' }) : '-'}</td>
                <td className="text-center">{it.qty}</td>
                <td className="text-right">{parseFloat(it.price || 0).toFixed(2)}</td>
                <td className="text-center">{it.disc || 0}</td>
                <td className="text-right"><strong>{total.toFixed(2)}</strong></td>
              </tr>
            );
          })}
          {[...Array(Math.max(0, 8 - data.items.length))].map((_, i) => (
            <tr key={`empty-${i}`} className="empty-row">
              <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="7" className="no-border"></td>
            <td className="total-label">Subtotal</td>
            <td className="total-val">₹{(data.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan="7" className="no-border"></td>
            <td className="total-label">Discount</td>
            <td className="total-val">-₹{(data.discount || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan="7" className="no-border border-bottom">
              <div className="print-amount-words">
                <strong>Amount in words: </strong> Rupees {netAmountWords}
              </div>
            </td>
            <td className="total-label grand">Net Amount</td>
            <td className="total-val grand">₹{netAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="print-notes-section">
        {data.notes && <div className="print-notes-content"><strong>Note:</strong> {data.notes}</div>}
      </div>

      <div className="print-footer-section">
        <div className="footer-left">
          {/* Terms & Taglines removed as requested */}
        </div>
        <div className="footer-right">
          <div className="auth-sign">
            <div className="sign-space"></div>
            <p>Authorized Signatory</p>
            <p><strong>National Medical Store</strong></p>
          </div>
        </div>
      </div>
      
      <div className="print-watermark">Computer Generated Invoice</div>
    </div>
  );
}
