import { supabase } from './supabase';
import html2pdf from 'html2pdf.js';

export const uploadBillPDF = async (billData) => {
  try {
    // Wait for React to finish rendering the template into the DOM
    await new Promise(resolve => setTimeout(resolve, 1200));

    const element = document.getElementById('print-area');
    if (!element || element.offsetHeight === 0) {
      console.error('Print area not found or empty');
      return null;
    }

    const opt = {
      margin: 0.2,
      filename: `${billData.bill_no}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 800, // Force a consistent width for capture
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF Blob
    const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
    
    // Upload to Supabase Storage
    const fileName = `${billData.user_id}/${billData.bill_no}_${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('bills')
      .upload(fileName, pdfBlob, { 
        contentType: 'application/pdf',
        upsert: true 
      });

    if (error) throw error;

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('bills')
      .getPublicUrl(fileName);

    // Update the bill record in the database with the PDF URL
    await supabase
      .from('bills')
      .update({ pdf_url: publicUrl })
      .eq('id', billData.id);

    return publicUrl;
  } catch (err) {
    console.error('Error uploading PDF:', err);
    return null;
  }
};
