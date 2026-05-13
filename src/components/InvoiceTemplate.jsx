import React from 'react';

/**
 * InvoiceTemplate — Professional A4 invoice layout.
 * Rendered off-screen for html2canvas capture.
 * Extracted from Dashboard.jsx for performance (code-splitting + smaller re-render surface).
 */
const InvoiceTemplate = React.memo(({ data }) => {
  React.useEffect(() => {
    if (data) {
      // Small delay to ensure browser has painted the new content
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('invoice-ready'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return null;
  const isSale = data.type === 'sale';

  return (
    <div
      id="invoice-capture-area"
      style={{
        width: '800px',
        padding: '60px',
        backgroundColor: '#fff',
        direction: 'rtl',
        fontFamily: "'Tajawal', sans-serif",
        color: '#0f172a',
        minHeight: '1000px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <div className="bg-white border-2 border-slate-200 shadow-2xl rounded-3xl p-10 print:shadow-none print:p-0 print:border-none relative mx-auto" style={{ width: '210mm', minHeight: '297mm', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", color: '#0f172a', display: 'flex', flexDirection: 'column' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '56px', position: 'relative', paddingTop: '8px' }}>

          {/* Right: Logo */}
          <div style={{ width: '33%', display: 'flex', justifyContent: 'flex-start' }}>
            <img
              src="/logo.jpg"
              alt="بركة الثمار"
              style={{ height: '100px', width: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.05)', marginLeft: 'auto' }}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>

          {/* Center: Title */}
          <div style={{ width: '33%', display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <div style={{ position: 'relative' }}>
              <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#0f172a', letterSpacing: '-2px', margin: '0', fontFamily: "'Reem Kufi', 'Changa', sans-serif" }}>
                فاتورة
              </h1>
              <div style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)', width: '48px', height: '6px', backgroundColor: '#4f46e5', borderRadius: '4px' }}></div>
            </div>
          </div>

          {/* Left: Invoice Info */}
          <div style={{ width: '33%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>
              {data.voucherCode && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>رقم المرجع:</span>
                  <span style={{ color: '#0f172a', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}>#{data.voucherCode.slice(-8).toUpperCase()}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <span style={{ color: '#94a3b8' }}>التاريخ:</span>
                <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{data.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <span style={{ color: '#94a3b8' }}>النوع:</span>
                <span style={{ color: '#0f172a' }}>{isSale ? 'مبيعات' : 'سند إخراج'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <span style={{ color: '#94a3b8' }}>المستفيد:</span>
                <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '16px' }}>{data.clientName || data.client || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div style={{ flex: 1, marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#f1f5f9', padding: '20px 12px', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#64748b', width: '48px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>م</th>
                <th style={{ backgroundColor: '#f1f5f9', padding: '20px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '900', color: '#64748b' }}>اسم الصنف</th>
                <th style={{ backgroundColor: '#f1f5f9', padding: '20px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#64748b', width: '128px' }}>التصنيف</th>
                <th style={{ backgroundColor: '#f1f5f9', padding: '20px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#64748b', width: '112px' }}>الكمية</th>
                <th style={{ backgroundColor: '#f1f5f9', padding: '20px 12px', textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#64748b', width: '96px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>الوحدة</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '24px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ padding: '24px 16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>
                      {item.name || item.item}
                      {item.company && item.company !== 'بدون شركة' && (
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', marginRight: '6px' }}> - {item.company}</span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{item.cat || '—'}</span>
                  </td>
                  <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>{item.qty}</span>
                  </td>
                  <td style={{ padding: '24px 12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{item.unit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#94a3b8' }}>ملاحظات</p>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>هذه الفاتورة صدرت إلكترونياً ولا تحتاج إلى توقيع.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#94a3b8', marginBottom: '4px' }}>إجمالي الأصناف</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#4f46e5', fontFamily: 'monospace', lineHeight: '1' }}>{data.items.length}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#cbd5e1', letterSpacing: '1px', textTransform: 'uppercase' }}>Baraket Althemar System • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;
