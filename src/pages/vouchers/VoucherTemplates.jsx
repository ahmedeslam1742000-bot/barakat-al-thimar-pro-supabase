import React from 'react';

/* ═══════════════════════════════════════════════════════════════════
   VOUCHER RECEIPT TEMPLATE — rendered off-screen for html2canvas capture
   Inbound:  م | الصنف والشركة | الكمية | ملاحظات          (emerald)
   Outbound: م | كود الصنف | الصنف والشركة | الكمية | ملاحظات (blue)
   50 rows, column separators, no الوحدة, no إجمالي footer
   Converted to standalone component.
═══════════════════════════════════════════════════════════════════ */

function SigBox({ label, accentHex }) {
  return (
    <div style={{ textAlign: 'center', border: `1.5px solid ${accentHex}40`, borderRadius: '12px', padding: '14px 20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 900, color: '#374151', marginBottom: '10px' }}>{label}</div>
      <div style={{ height: '52px', borderBottom: '1.5px solid #cbd5e1' }} />
    </div>
  );
}

export function VoucherReceiptTemplate({ kind, group, paddedLines, accentHex, accentLight, accentDark, partyLabel, partyValue, userName, settings }) {
  const printDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const isIn = kind === 'in';
  const showNotes   = settings?.voucherShowNotes   !== false;
  const showCompany = settings?.voucherShowCompany !== false;
  const orgEmoji    = settings?.orgEmoji    || '🌿';
  const orgName     = settings?.orgName     || 'مؤسسة بركة الثمار';
  const orgSubtitle = settings?.orgSubtitle || 'للتجارة والتوزيع الغذائي';
  const orgContact  = settings?.orgContact  || '';

  // Shared cell border style
  const cellBorder = `1px solid #e5e7eb`;
  const thStyle = {
    padding: '8px 6px',
    fontWeight: 900,
    textAlign: 'center',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    borderLeft: cellBorder,
    borderRight: cellBorder,
    color: '#fff',
    background: accentHex,
  };
  const tdBase = {
    padding: '5px 6px',
    borderLeft: cellBorder,
    borderRight: cellBorder,
    borderBottom: cellBorder,
    fontSize: '11px',
  };

  return (
    <div style={{ fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: 'rtl', color: '#111827', width: '100%', paddingTop: '8px' }}>

      {/* ── MINIMAL 3-COLUMN HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', borderBottom: `3px solid ${accentHex}`, paddingBottom: '14px', marginBottom: '16px' }}>
        {/* RIGHT: Branding */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: accentHex, lineHeight: 1.2 }}>{orgEmoji} {orgName}</div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', fontWeight: 700 }}>{orgSubtitle}</div>
        </div>
        {/* CENTER: Bold Title Pill — perfectly centered */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0', background: accentHex, borderRadius: '12px',
          minWidth: '180px', height: '64px',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1, textAlign: 'center' }}>
            {isIn ? 'سند إدخال بضاعة' : 'سند إخراج بضاعة'}
          </div>
        </div>
        {/* LEFT: Meta — increased line-height for breathing room */}
        <div style={{ textAlign: 'left', direction: 'ltr', fontSize: '12px', fontWeight: 700, color: '#374151', lineHeight: 2.4 }}>
          <div>التاريخ: <b style={{ color: accentDark }}>{group?.date || '—'}</b></div>
          <div>{partyLabel}: <b style={{ color: accentDark }}>{partyValue || '—'}</b></div>
          {group?.voucherCode && <div>رقم السند: <b style={{ color: accentDark }}>{group.voucherCode}</b></div>}
        </div>
      </div>

      {/* ── CARGO TABLE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed', border: `1px solid #e5e7eb` }}>
        <colgroup>
          <col style={{ width: '32px' }} />
          <col />{/* اسم الصنف — takes all remaining space */}
          <col style={{ width: showNotes ? '64px' : '80px' }} />
          {showNotes && <col style={{ width: '110px' }} />}
        </colgroup>
        <thead>
          <tr style={{ background: accentHex }}>
            <th style={thStyle}>م</th>
            <th style={{ ...thStyle, textAlign: 'right', padding: '9px 12px' }}>اسم الصنف</th>
            <th style={thStyle}>الكمية</th>
            {showNotes && <th style={thStyle}>ملاحظات</th>}
          </tr>
        </thead>
        <tbody>
          {paddedLines.map((line, i) => {
            const rowBg = i % 2 === 0 ? '#f9fafb' : '#ffffff';
            return (
              <tr key={i} style={{ background: rowBg }}>
                <td style={{ ...tdBase, textAlign: 'center', color: '#94a3b8', fontWeight: 800, fontSize: '10px', borderLeft: '1px solid #e5e7eb' }}>{line ? i + 1 : ''}</td>
                <td style={{ ...tdBase, fontWeight: line ? 700 : 400, textAlign: 'right', padding: '6px 12px' }}>
                  {line ? (
                    <>
                      <span style={{ display: 'block', fontWeight: 800, color: '#111827' }}>{line.item}</span>
                      {showCompany && line.company && (
                        <span style={{ display: 'block', fontSize: '9.5px', color: '#6b7280', marginTop: '1px' }}>{line.company}</span>
                      )}
                    </>
                  ) : null}
                </td>
                <td style={{ ...tdBase, textAlign: 'center', fontWeight: 900, color: accentDark }}>
                  {line?.qty != null ? (
                    <span style={{ background: accentLight, padding: '1px 8px', borderRadius: '5px', display: 'inline-block' }}>
                      {line.qty}
                    </span>
                  ) : null}
                </td>
                {showNotes && (
                  <td style={{ ...tdBase, textAlign: 'center', color: '#374151', fontSize: '10px', borderRight: '1px solid #e5e7eb' }}>
                    {line ? (line.lineNote || line.lineSupplyNote || '') : ''}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── TWO SIGNATURE BOXES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '22px', paddingTop: '20px', borderTop: `1px dashed ${accentHex}` }}>
        <SigBox label="أمين المستودع" accentHex={accentHex} />
        <SigBox label="المستلم" accentHex={accentHex} />
      </div>

      {/* ── FOOTER ── */}
      <div style={{ marginTop: '16px', fontSize: '8.5px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>طُبع بواسطة: {userName} — {printDate}</span>
        <span style={{ color: accentHex, fontWeight: 700 }}>
          نظام بركة الثمار الإلكتروني {orgContact && `— ${orgContact}`}
        </span>
        <span>للأرشيفة الداخلية</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLANK VOUCHER TEMPLATE — 30-row A4-optimised empty cargo list
   In:  م | الصنف والشركة (wide) | الكمية | ملاحظات
   Out: م | كود الصنف | الصنف والشركة | الكمية | ملاحظات
═══════════════════════════════════════════════════════════════════ */

export function BlankVoucherTemplate({ kind, accentHex, accentLight, accentDark, partyLabel, settings }) {
  const ROWS = 30;
  const isIn = kind === 'in';
  const showNotes   = settings?.voucherShowNotes   !== false;
  const orgEmoji    = settings?.orgEmoji    || '🌿';
  const orgName     = settings?.orgName     || 'مؤسسة بركة الثمار';
  const orgSubtitle = settings?.orgSubtitle || 'للتجارة والتوزيع الغذائي';
  const orgContact  = settings?.orgContact  || '';

  const cellBorder = `1px solid #e5e7eb`;
  const thStyle = {
    padding: '6px 5px',
    fontWeight: 900,
    textAlign: 'center',
    fontSize: '10px',
    whiteSpace: 'nowrap',
    borderLeft: cellBorder,
    borderRight: cellBorder,
    color: '#fff',
    background: accentHex,
  };
  const tdBase = {
    padding: '4px 5px',
    borderLeft: cellBorder,
    borderRight: cellBorder,
    borderBottom: cellBorder,
    fontSize: '10.5px',
    height: '22px',
  };

  return (
    <div style={{ fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: 'rtl', color: '#111827', width: '100%', paddingTop: '8px' }}>

      {/* ── COMPACT 3-COL HEADER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', borderBottom: `3px solid ${accentHex}`, paddingBottom: '12px', marginBottom: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: accentHex, lineHeight: 1.2 }}>{orgEmoji} {orgName}</div>
          <div style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '4px', fontWeight: 700 }}>{orgSubtitle}</div>
        </div>
        {/* CENTER: Title box with fixed height for perfect centering */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0', background: accentHex, borderRadius: '10px',
          minWidth: '160px', height: '58px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1, textAlign: 'center' }}>
            {isIn ? 'إذن استلام بضاعة' : 'إذن صرف بضاعة'}
          </div>
        </div>
        {/* LEFT: Meta with generous line-height */}
        <div style={{ textAlign: 'left', direction: 'ltr', fontSize: '11px', fontWeight: 700, color: '#374151', lineHeight: 2.5 }}>
          <div>التاريخ: _______________________</div>
          <div>{partyLabel}: _____________________</div>
        </div>
      </div>

      {/* ── BLANK CARGO TABLE (30 rows) ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', tableLayout: 'fixed', border: `1px solid #e5e7eb` }}>
        <colgroup>
          <col style={{ width: '28px' }} />
          <col />
          <col style={{ width: showNotes ? '58px' : '80px' }} />
          {showNotes && <col style={{ width: '100px' }} />}
        </colgroup>
        <thead>
          <tr style={{ background: accentHex }}>
            <th style={thStyle}>م</th>
            <th style={{ ...thStyle, textAlign: 'right', padding: '7px 10px' }}>اسم الصنف</th>
            <th style={thStyle}>الكمية</th>
            {showNotes && <th style={thStyle}>ملاحظات</th>}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
              <td style={{ ...tdBase, textAlign: 'center', color: (i + 1) % 10 === 0 ? accentDark : '#94a3b8', fontWeight: 800, fontSize: '9.5px', borderLeft: '1px solid #e5e7eb' }}>{i + 1}</td>
              <td style={tdBase} />
              <td style={showNotes ? tdBase : { ...tdBase, borderRight: '1px solid #e5e7eb' }} />
              {showNotes && <td style={{ ...tdBase, borderRight: '1px solid #e5e7eb' }} />}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── SIGNATURE BOXES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '16px', paddingTop: '14px', borderTop: `1px dashed ${accentHex}` }}>
        <SigBox label="أمين المستودع" accentHex={accentHex} />
        <SigBox label="المستلم" accentHex={accentHex} />
      </div>

      <div style={{ marginTop: '12px', fontSize: '7.5px', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: accentHex, fontWeight: 700 }}>
          نظام بركة الثمار الإلكتروني {orgContact && `— ${orgContact}`}
        </span>
        <span>للأرشيفة الداخلية</span>
      </div>
    </div>
  );
}
