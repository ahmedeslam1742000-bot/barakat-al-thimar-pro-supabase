import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Banknote, Search, Plus, Printer, Filter, 
  Download, Calendar, User, Hash, Info, 
  ArrowUpRight, Clock, CheckCircle2, ChevronRight,
  MoreHorizontal, FileText, CreditCard, Wallet, X,
  ChevronDown, Users, AlertTriangle, Pencil, Trash2,
  LogOut, Landmark, Eye, CalendarCheck, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useData } from '../contexts/DataContext';
import { useDebounce } from '../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';
import SmartDateInput from '../components/SmartDateInput';

const ReceiptVoucherRow = React.memo(({ v, idx, openEdit, setViewVoucher, toggleDepositStatus, formatDateToDisplay }) => (
  <tr className="group hover:bg-slate-50 transition-colors h-[52px]">
    <td className="px-6 py-4 text-center">
      <span className="text-[11px] font-black text-slate-400">{idx + 1}</span>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex flex-col items-center">
        <span className="text-xs font-black text-slate-800">{formatDateToDisplay(v.date)}</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-black text-[#0f2747]">{v.repName}</span>
        <span className="text-[10px] font-bold text-slate-400">اسم المندوب</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-black text-slate-800">{v.customerName}</span>
        <span className="text-[10px] font-bold text-slate-400">اسم العميل</span>
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex flex-col items-center">
        <span className="text-sm font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">{v.voucherNo}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-1">رقم السند</span>
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-black tabular-nums bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 mx-auto w-fit">
        <span className="text-lg">{v.amount.toLocaleString()}</span>
        <Banknote size={14} />
      </div>
    </td>
    <td className="px-6 py-4 text-center">
      <button 
        onClick={() => toggleDepositStatus(v.id, v.is_deposited)}
        className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 mx-auto ${
          v.is_deposited 
            ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' 
            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
        }`}
      >
        {v.is_deposited ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {v.is_deposited ? 'تم الإيداع' : 'في الخزينة'}
      </button>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setViewVoucher(v)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm">
          <Eye size={16} />
        </button>
        <button onClick={() => openEdit(v)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
          <Pencil size={16} />
        </button>
      </div>
    </td>
  </tr>
));

// Helper to format date to DD/MM/YYYY
const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function ReceiptVouchers({ setActiveView }) {
  const { receiptVouchers, repExpenses, repsList: reps, fetchInitialData } = useData();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettlementWizardOpen, setIsSettlementWizardOpen] = useState(false);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);
  const [settlementType, setSettlementType] = useState('pending'); // pending, settled
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewVoucher, setViewVoucher] = useState(null);
  const [repSearchQuery, setRepSearchQuery] = useState('');
  const [isRepDropdownOpen, setIsRepDropdownOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const parentRef = React.useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  // Form State
  const emptyForm = {
    date: new Date().toISOString().split('T')[0], 
    repName: '', 
    customerName: '',
    amount: '',
    type: 'نقدي',
    voucherNo: ''
  };
  const [form, setForm] = useState(emptyForm);

  // Table Data — loaded from Supabase
  const [vouchers, setVouchers] = useState([]);

  // Fetch vouchers from Supabase
  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('receipt_vouchers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ fetchVouchers error:', error);
    } else {
        setVouchers((data || []).map(r => ({
          id: r.id,
          date: r.date,
          repName: r.rep_name,
          customerName: r.customer_name,
          voucherNo: r.voucher_no,
          amount: Number(r.amount),
          type: r.type,
          is_deposited: r.is_deposited || false,
          deposited_at: r.deposited_at || null,
        })));
    }
  };

  const toggleDepositStatus = async (id, currentStatus) => {
    try {
      const updateData = { 
        is_deposited: !currentStatus,
        deposited_at: !currentStatus ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('receipt_vouchers')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      
      toast.success(!currentStatus ? 'تم تسجيل الإيداع بالبنك ✅' : 'تم استرجاع السند للخزينة ↩️');
      await fetchVouchers();
      
      if (viewVoucher && viewVoucher.id === id) {
        setViewVoucher(prev => ({ ...prev, is_deposited: !currentStatus, deposited_at: updateData.deposited_at }));
      }
    } catch (err) {
      console.error('❌ toggleDepositStatus error:', err);
      toast.error('حدث خطأ أثناء تغيير الحالة. (يرجى التأكد من إضافة حقل is_deposited و deposited_at)');
    }
  };

  // Removed local fetching, now using DataContext
  useEffect(() => {
    // We can keep this if we need manual refresh, but DataContext handles real-time
  }, []);

  const filteredVouchers = useMemo(() => {
    return receiptVouchers.filter(v => {
      const matchesSearch = (v.voucherNo || '').includes(debouncedSearchTerm) ||
                            (v.repName || '').includes(debouncedSearchTerm) ||
                            (v.customerName || '').includes(debouncedSearchTerm);
      const matchesStatus = settlementType === 'all' || 
                            (settlementType === 'pending' && !v.is_settled) || 
                            (settlementType === 'settled' && v.is_settled);
      return matchesSearch && matchesStatus;
    });
  }, [receiptVouchers, debouncedSearchTerm, settlementType]);

  const toggleVoucherSelection = (id) => {
    setSelectedVoucherIds(prev => prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.repName || !expenseForm.amount || !expenseForm.statement) {
      toast.error('يرجى إكمال جميع الحقول الإلزامية');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('representative_expenses').insert([{
        rep_name: expenseForm.repName,
        amount: Number(expenseForm.amount),
        statement: expenseForm.statement,
        date: expenseForm.date
      }]);
      if (error) throw error;
      toast.success('تم تسجيل المصروف بنجاح');
      setIsExpenseModalOpen(false);
      setExpenseForm({ date: new Date().toISOString().split('T')[0], repName: '', amount: '', statement: '' });
      setExpRepSearchQuery('');
    } catch (err) {
      console.error('SaveExpense error:', err);
      toast.error('خطأ أثناء حفظ المصروف');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSettlement = async () => {
    setLoading(true);
    try {
      const batchId = crypto.randomUUID();
      // Update Vouchers
      const { error: vError } = await supabase
        .from('receipt_vouchers')
        .update({ is_settled: true, settlement_batch_id: batchId })
        .in('id', selectedVoucherIds);
      if (vError) throw vError;

      // Update Expenses
      if (selectedExpenseIds.length > 0) {
        const { error: eError } = await supabase
          .from('representative_expenses')
          .update({ is_settled: true, settlement_batch_id: batchId })
          .in('id', selectedExpenseIds);
        if (eError) throw eError;
      }

      toast.success('تم ترحيل البيانات وتسوية الحساب بنجاح ✅');
      setSelectedVoucherIds([]);
      setSelectedExpenseIds([]);
      setIsSettlementWizardOpen(false);
    } catch (err) {
      console.error('Settlement error:', err);
      toast.error('خطأ أثناء إتمام التسوية');
    } finally {
      setLoading(false);
    }
  };

  rowVirtualizer.options.count = filteredVouchers.length;

  // Dirty check
  const isDirty = useMemo(() => {
    const { repName: _, ...formData } = form;
    const emptyData = { date: new Date().toISOString().split('T')[0], customerName: '', amount: '', type: 'نقدي', voucherNo: '' };
    return JSON.stringify(formData) !== JSON.stringify(emptyData) || repSearchQuery !== '';
  }, [form, repSearchQuery]);



  const filteredReps = useMemo(() => {
    if (!repSearchQuery) return reps;
    const q = repSearchQuery.toLowerCase();
    return reps.filter(r => r.name.toLowerCase().includes(q));
  }, [reps, repSearchQuery]);

  // Actions
  const handleSaveVoucher = () => {
    const finalRepName = repSearchQuery || form.repName;
    const currentForm = { ...form, repName: finalRepName };

    const requiredFields = ['date', 'repName', 'customerName', 'amount', 'type', 'voucherNo'];
    // Invoice number is now optional to prevent blocking, but we keep the logic for Account Payment
    
    for (const field of requiredFields) {
      if (!currentForm[field]) {
        toast.error(`يرجى إكمال الحقل: ${getLabelText(field)}`);
        return;
      }
    }

    const exists = reps.some(r => r.name === finalRepName);
    if (!exists) {
      toast.error('يرجى اختيار مندوب صالح من القائمة');
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const confirmSave = async () => {
    const finalRepName = repSearchQuery || form.repName;
    setLoading(true);
    try {
      const payload = {
        date: form.date,
        rep_name: finalRepName,
        customer_name: form.customerName,
        voucher_no: form.voucherNo,
        invoice_no: '',
        amount: Number(form.amount),
        type: form.type,
      };

      if (editId) {
        const { error } = await supabase.from('receipt_vouchers').update(payload).eq('id', editId);
        if (error) throw error;
        toast.success('✅ تم التعديل بنجاح');
      } else {
        const { error } = await supabase.from('receipt_vouchers').insert([payload]);
        if (error) throw error;
        toast.success('✅ تم حفظ السند بنجاح');
      }

      await fetchInitialData();
    } catch (err) {
      console.error('❌ confirmSave error:', err);
      toast.error(`خطأ في الحفظ: ${err?.message || 'حدث خطأ غير متوقع'}`);
    } finally {
      setLoading(false);
      setIsConfirmSaveOpen(false);
      setIsModalOpen(false);
      setForm(emptyForm);
      setRepSearchQuery('');
      setEditId(null);
    }
  };

  const handleCloseModal = () => {
    if (isDirty) {
      setIsConfirmCloseOpen(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const confirmExit = () => {
    setIsConfirmCloseOpen(false);
    setIsModalOpen(false);
    setForm(emptyForm);
    setRepSearchQuery('');
    setEditId(null);
  };

  const openEdit = (voucher) => {
    setForm({
      date: voucher.date,
      repName: voucher.repName,
      customerName: voucher.customerName,
      amount: voucher.amount,
      type: voucher.type,
      voucherNo: voucher.voucherNo
    });
    setRepSearchQuery(voucher.repName);
    setEditId(voucher.id);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('لم نتمكن من فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك.');
      return;
    }
    
    // Group vouchers by type
    const groupedVouchers = filteredVouchers.reduce((acc, v) => {
      if (!acc[v.type]) acc[v.type] = [];
      acc[v.type].push(v);
      return acc;
    }, {});

    let contentHtml = '';
    let grandTotal = 0;

    const types = ['نقدي', 'شبكة']; // Predefined order

    types.forEach(type => {
      const vouchersForType = groupedVouchers[type];
      if (!vouchersForType || vouchersForType.length === 0) return;

      const subtotal = vouchersForType.reduce((sum, v) => sum + Number(v.amount || 0), 0);
      grandTotal += subtotal;

      const tableRows = vouchersForType.map((v, i) => `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>${formatDateToDisplay(v.date)}</td>
          <td class="font-bold">${v.repName}</td>
          <td>${v.customerName}</td>
          <td class="text-center">${v.voucherNo}</td>
          <td class="text-center font-bold text-emerald">${v.amount.toLocaleString()} ر.س</td>
          <td class="text-center"><span class="badge ${type === 'نقدي' ? 'badge-cash' : type === 'شبكة' ? 'badge-card' : 'badge-transfer'}">${v.type}</span></td>
        </tr>
      `).join('');

      contentHtml += `
        <div class="section-title">محصلات الدفع: ${type}</div>
        <table>
          <thead>
            <tr>
              <th width="5%">م</th>
              <th width="12%">التاريخ</th>
              <th width="18%">المندوب</th>
              <th width="18%">العميل</th>
              <th width="15%">رقم السند</th>
              <th width="15%">المبلغ</th>
              <th width="12%">نوع التحصيل</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-left font-bold" style="padding-left: 20px;">إجمالي (${type}):</td>
              <td class="text-center font-black text-emerald" style="font-size: 14px;">${subtotal.toLocaleString()} ر.س</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    });

    const html = `
      <html dir="rtl">
        <head>
          <title>تقرير سندات القبض</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            
            :root {
              --primary: #059669;
              --primary-light: #d1fae5;
              --text-main: #1e293b;
              --text-muted: #64748b;
              --border-color: #e2e8f0;
              --bg-light: #f8fafc;
            }

            * { box-sizing: border-box; }
            body { 
              font-family: 'Cairo', sans-serif; 
              padding: 40px; 
              color: var(--text-main); 
              background-color: #fff;
              line-height: 1.5;
            }

            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid var(--primary-light);
            }

            .report-main-title {
              /* Defined below */
            }

            .section-title {
              font-size: 18px;
              font-weight: 800;
              color: #334155;
              margin: 30px 0 15px 0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-title::before {
              content: '';
              display: inline-block;
              width: 6px;
              height: 20px;
              background-color: var(--primary);
              border-radius: 4px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            table { 
              width: 100%; 
              border-collapse: separate; 
              border-spacing: 0;
              margin-bottom: 10px; 
              border: 1px solid var(--border-color);
              border-radius: 12px;
              overflow: hidden;
            }

            th, td { 
              padding: 10px 8px; 
              text-align: right; 
              font-size: 11px; 
            }

            th { 
              background-color: var(--bg-light); 
              font-weight: 800; 
              color: #475569; 
              border-bottom: 2px solid var(--border-color);
              white-space: nowrap;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            td {
              border-bottom: 1px solid var(--border-color);
              color: #334155;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 150px; /* safety for extremely long text */
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            tbody tr:nth-child(even) td {
              background-color: #fcfcfc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            tfoot td {
              background-color: var(--bg-light);
              border-top: 2px solid var(--border-color);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .text-emerald { color: #059669; }

            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .badge-cash { background: #d1fae5; color: #047857; }
            .badge-card { background: #dbeafe; color: #1d4ed8; }
            .badge-transfer { background: #f3e8ff; color: #7e22ce; }


            .report-main-title {
              font-size: 32px;
              font-weight: 900;
              color: var(--primary);
              letter-spacing: -0.5px;
              text-shadow: 2px 2px 0px rgba(5, 150, 105, 0.1);
              font-family: 'Cairo', sans-serif;
              position: relative;
              display: inline-block;
            }
            
            .report-main-title::after {
              content: '';
              position: absolute;
              bottom: -4px;
              right: 0;
              width: 50%;
              height: 4px;
              background-color: var(--primary);
              border-radius: 4px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .meta-info {
              text-align: left;
            }

            .meta-item {
              font-size: 14px;
              color: var(--text-muted);
            }
            .meta-item span {
              font-weight: 800;
              color: var(--text-main);
              margin-right: 8px;
              background-color: var(--bg-light);
              padding: 4px 12px;
              border-radius: 8px;
              border: 1px solid var(--border-color);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @media print {
              body { padding: 0; }
              table {
                break-inside: auto;
              }
              tr {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <div class="report-main-title">تقرير سندات القبض</div>
            </div>
            <div class="meta-info">
              <div class="meta-item">تاريخ الإصدار: <span>${new Date().toLocaleDateString('ar-SA')}</span></div>
            </div>
          </div>
          
          ${contentHtml || '<div class="text-center" style="padding: 40px; color: var(--text-muted);">لا توجد بيانات للعرض</div>'}
          
          <script>
            window.onload = () => {
              window.print();
            };
            window.onafterprint = () => {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('receipt_vouchers').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم الحذف بنجاح');
      await fetchVouchers();
    } catch (err) {
      console.error('❌ handleDelete error:', err);
      toast.error('خطأ أثناء الحذف');
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen && !isConfirmCloseOpen && !isConfirmSaveOpen && !viewVoucher) return;

      if (e.key === 'Escape') {
        if (isConfirmSaveOpen) setIsConfirmSaveOpen(false);
        else if (isConfirmCloseOpen) setIsConfirmCloseOpen(false);
        else if (viewVoucher) setViewVoucher(null);
        else handleCloseModal();
      }
      
      if (e.key === 'Enter') {
        if (isConfirmSaveOpen) {
          confirmSave();
        } 
        else if (isConfirmCloseOpen) {
          confirmExit();
        }
        else if (isModalOpen && !isRepDropdownOpen) {
          handleSaveVoucher();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isConfirmSaveOpen, isConfirmCloseOpen, isDirty, form, isRepDropdownOpen, repSearchQuery, reps]);

  const getLabelText = (key) => {
    const labels = {
      date: 'التاريخ',
      repName: 'اسم المندوب',
      customerName: 'اسم العميل',
      amount: 'المبلغ',
      type: 'نوع التحصيل',
      voucherNo: 'رقم السند'
    };
    return labels[key] || key;
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 bg-[#f8fafc] dark:bg-slate-950 font-readex overflow-hidden" dir="rtl">
      
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-600/20 border border-white/20">
            <Banknote size={28} className="text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">سندات القبض</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إدارة التحصيل المالي</span>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 max-w-4xl">
          <div className="relative flex-1 w-full group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث برقم السند، اسم المندوب، أو العميل..."
              className="w-full h-12 pr-11 pl-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="h-12 px-5 flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <Calendar size={16} className="text-emerald-500" />
            <span className="hidden sm:inline">تصفية بالتاريخ</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => {
              setExpenseForm({ date: new Date().toISOString().split('T')[0], repName: '', amount: '', statement: '' });
              setExpRepSearchQuery('');
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-amber-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>إضافة مصروف</span>
          </button>
          <button 
            onClick={() => {
              setForm(emptyForm);
              setRepSearchQuery('');
              setEditId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>إنشاء سند جديد</span>
          </button>
          <button 
            onClick={selectedVoucherIds.length > 0 ? () => setIsSettlementWizardOpen(true) : handlePrint}
            className={`p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm flex items-center gap-2 ${selectedVoucherIds.length > 0 ? 'text-blue-500 border-blue-200 bg-blue-50/50' : 'text-slate-500 hover:text-emerald-500'}`}
          >
            <Printer size={20} />
            {selectedVoucherIds.length > 0 && <span className="text-[10px] font-black">طباعة تسوية ({selectedVoucherIds.length})</span>}
          </button>
        </div>
      </div>

      {/* Tabs for settlement status */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        {[
          { id: 'pending', label: 'السندات المعلقة', icon: <Clock size={14} /> },
          { id: 'settled', label: 'سندات موردة', icon: <CheckCircle2 size={14} /> },
          { id: 'all', label: 'الكل', icon: <Filter size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettlementType(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              settlementType === tab.id 
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>



      {/* ═══ TABLE ═══ */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-right border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-700 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={filteredVouchers.length > 0 && selectedVoucherIds.length === filteredVouchers.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedVoucherIds(filteredVouchers.map(v => v.id));
                      else setSelectedVoucherIds([]);
                    }}
                  />
                </th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 w-16 text-center">م</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">التاريخ</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 min-w-[200px]">اسم المندوب</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 min-w-[200px]">اسم العميل</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center">رقم السند</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center">المبلغ</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center">حالة الإيداع</th>
                <th className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center w-24">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredVouchers.map((voucher, idx) => (
                <tr style={{ animationDelay: `${idx * 0.05}s`, opacity: 0 }} key={voucher.id} className={`animate-fade-in-up group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors ${selectedVoucherIds.includes(voucher.id) ? 'bg-emerald-50/50' : ''}`}>
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={selectedVoucherIds.includes(voucher.id)}
                      onChange={() => toggleVoucherSelection(voucher.id)}
                    />
                  </td>
                  <td className="px-6 py-5 text-center text-xs font-black text-slate-400 group-hover:text-emerald-500 transition-colors">{idx + 1}</td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-700 dark:text-white">{formatDateToDisplay(voucher.date)}</td>
                  <td className="px-6 py-5 text-xs font-black text-slate-700 dark:text-white">
                    {voucher.repName}
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300">{voucher.customerName}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black border border-slate-200/50 dark:border-slate-700">
                      {voucher.voucherNo}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-black text-emerald-600 dark:text-emerald-400">{voucher.amount.toLocaleString()} <small className="text-[10px]">ر.س</small></td>
                  <td className="px-6 py-5 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border ${
                        voucher.is_deposited 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                          : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                      }`}
                    >
                      {voucher.is_deposited ? (
                        <><Landmark size={12} /> تم الإيداع</>
                      ) : (
                        <><Wallet size={12} /> في الخزينة</>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewVoucher(voucher)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all" title="تفاصيل السند (للإيداع)">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(voucher)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="تعديل">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(voucher.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="مسح">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MAIN MODAL ═══ */}
      <AnimatePresence>
        {isModalOpen && (
          <div key="main-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    <Banknote size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                      {editId ? 'تعديل سند قبض' : 'تحصيل مبلغ نقدي'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تسجيل عملية قبض مالي جديدة في النظام</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm"><X size={24} /></button>
              </div>
              
              <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20 dark:bg-slate-900/10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* ─── LEFT SIDE: AMOUNT HERO ─── */}
                  <div className="lg:col-span-6 flex flex-col justify-center border-l border-slate-100 dark:border-slate-800 pl-10">
                    <div className="mb-8">
                       <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest mr-1">المبلغ المحصل</label>
                       <div className="relative group">
                         <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition-opacity"></div>
                         <div className="relative flex flex-row-reverse items-center h-32 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-8 shadow-sm group-focus-within:border-emerald-500/30 transition-all">
                           <input 
                              type="number" 
                              required 
                              step="0.01" 
                              autoFocus
                              className="w-full bg-transparent font-black text-4xl outline-none text-emerald-600 dark:text-emerald-400 tabular-nums placeholder:text-slate-200 dark:placeholder:text-slate-800 text-center" 
                              placeholder="0.00" 
                              value={form.amount} 
                              onChange={(e) => setForm({...form, amount: e.target.value})} 
                            />
                           <div className="flex flex-col items-center justify-center ml-4 border-l border-slate-100 dark:border-slate-800 pl-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العملة</span>
                             <span className="text-xl font-black text-emerald-600">ر.س</span>
                           </div>
                         </div>
                       </div>
                       <p className="mt-4 text-[10px] font-bold text-slate-400 flex items-center gap-2 mr-2">
                         <Info size={14} className="text-emerald-500" />
                         يرجى التأكد من مطابقة المبلغ قبل تأكيد الحفظ
                       </p>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 border border-emerald-100/50 dark:border-emerald-800/30">
                       <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 mb-2">
                         <Wallet size={18} />
                         <span className="text-xs font-black">طريقة التحصيل: نقدي</span>
                       </div>
                       <p className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-500/60 leading-relaxed">سيتم إضافة هذا المبلغ مباشرة إلى عهدة المندوب المختص وتدقيقه في كشف الحساب.</p>
                    </div>
                  </div>

                  {/* ─── RIGHT SIDE: METADATA ─── */}
                  <div className="lg:col-span-6 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-1">
                        <label className="block text-[11px] font-black text-slate-500 mb-2.5 mr-1 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" /> تاريخ السند
                        </label>
                        <SmartDateInput 
                          required 
                          value={form.date} 
                          onChange={(val) => setForm({...form, date: val})}
                          className="w-full h-14 px-6 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 dark:text-white shadow-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[11px] font-black text-slate-500 mb-2.5 mr-1 flex items-center gap-2">
                          <Hash size={14} className="text-slate-400" /> رقم السند
                        </label>
                        <input type="text" required className="w-full h-14 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 dark:text-white shadow-sm" placeholder="1001" value={form.voucherNo} onChange={(e) => setForm({...form, voucherNo: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-500 mb-2.5 mr-1 flex items-center gap-2">
                        <Users size={14} className="text-slate-400" /> اسم العميل المستلم منه
                      </label>
                      <input type="text" required className="w-full h-14 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 dark:text-white shadow-sm" placeholder="أدخل اسم العميل بالكامل..." value={form.customerName} onChange={(e) => setForm({...form, customerName: e.target.value})} />
                    </div>

                    <div className="relative">
                      <label className="block text-[11px] font-black text-slate-500 mb-2.5 mr-1 flex items-center gap-2">
                        <UserCircle size={14} className="text-slate-400" /> المندوب المحصل
                      </label>
                      <input type="text" required autoComplete="off" className="w-full h-14 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 dark:text-white shadow-sm" placeholder="ابحث عن المندوب..." value={repSearchQuery} onFocus={() => setIsRepDropdownOpen(true)} onBlur={() => setTimeout(() => setIsRepDropdownOpen(false), 200)} onChange={(e) => { setRepSearchQuery(e.target.value); setIsRepDropdownOpen(true); }} />
                      <AnimatePresence>
                        {isRepDropdownOpen && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-20 top-[calc(100%+8px)] right-0 left-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-52 overflow-y-auto custom-scrollbar p-1.5">
                            {filteredReps.length > 0 ? filteredReps.map((r, i) => (
                              <button key={i} type="button" onMouseDown={(e) => { e.preventDefault(); setRepSearchQuery(r.name); setIsRepDropdownOpen(false); }} className="w-full text-right px-4 py-3 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all">{r.name}</button>
                            )) : <div className="px-4 py-4 text-xs font-bold text-slate-400 text-center italic">لا توجد نتائج مطابقة</div>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mr-2">
                  <Clock size={14} />
                  سيتم حفظ السند في السجل المالي فور التأكيد
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={handleCloseModal} className="px-6 py-3 font-black text-xs text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">تجاهل</button>
                  <button type="button" onClick={handleSaveVoucher} className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    حفظ السند المالي
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ VIEW DETAILS MODAL ═══ */}
      <AnimatePresence>
        {viewVoucher && (
          <div key="view-modal" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewVoucher(null)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                      تفاصيل سند القبض
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">سند رقم: {viewVoucher.voucherNo}</p>
                  </div>
                </div>
                <button onClick={() => setViewVoucher(null)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm"><X size={20} /></button>
              </div>
              
              {/* Body */}
              <div className="p-8 bg-slate-50/30 dark:bg-slate-900/30 space-y-6">
                
                {/* Amount Highlight */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المبلغ المحصل</span>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {viewVoucher.amount.toLocaleString()} <span className="text-sm">ر.س</span>
                  </div>
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    نوع التحصيل: {viewVoucher.type}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-black text-slate-400 mb-1">التاريخ</span>
                    <span className="font-bold text-slate-700 dark:text-white text-sm">{formatDateToDisplay(viewVoucher.date)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-black text-slate-400 mb-1">رقم السند</span>
                    <span className="font-bold text-slate-700 dark:text-white text-sm">{viewVoucher.voucherNo}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-black text-slate-400 mb-1">اسم المندوب</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-sm">{viewVoucher.repName}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <span className="block text-[10px] font-black text-slate-400 mb-1">اسم العميل</span>
                    <span className="font-bold text-slate-700 dark:text-white text-sm">{viewVoucher.customerName}</span>
                  </div>
                </div>

                {/* Deposit Action Area */}
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                  {viewVoucher.is_deposited ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h4 className="font-black text-emerald-800 dark:text-emerald-300 text-sm mb-1.5">تم إيداع السند بنجاح</h4>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400/80 flex items-center gap-1.5 mb-2">
                          <CalendarCheck size={14} />
                          بتاريخ: {viewVoucher.deposited_at ? new Date(viewVoucher.deposited_at).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'غير مسجل'}
                        </p>
                        <button 
                          onClick={() => toggleDepositStatus(viewVoucher.id, true)}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline transition-colors"
                          title="تراجع عن الإيداع"
                        >
                          إلغاء الإيداع
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => toggleDepositStatus(viewVoucher.id, false)}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Landmark size={20} />
                      تأكيد إيداع السند في البنك
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ CONFIRMATION DIALOGS ═══ */}
      <AnimatePresence>
        {(isConfirmCloseOpen || isConfirmSaveOpen) && (
          <div key="confirm-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsConfirmCloseOpen(false); setIsConfirmSaveOpen(false); }} className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 text-center">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isConfirmSaveOpen ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>{isConfirmSaveOpen ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}</div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">{isConfirmSaveOpen ? 'تأكيد حفظ السند' : 'إلغاء الإدخال؟'}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{isConfirmSaveOpen ? 'هل أنت متأكد من صحة كافة البيانات المدخلة وتريد حفظ السند الآن؟' : 'لقد قمت بتغيير بعض البيانات، هل تريد الخروج دون حفظ التغييرات؟'}</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => { if (isConfirmSaveOpen) confirmSave(); else confirmExit(); }} className={`flex-1 py-3 rounded-xl font-black text-xs text-white shadow-lg ${isConfirmSaveOpen ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>نعم، {isConfirmSaveOpen ? 'حفظ' : 'خروج'} (Enter)</button>
                <button type="button" onClick={() => { setIsConfirmCloseOpen(false); setIsConfirmSaveOpen(false); }} className="flex-1 py-3 rounded-xl font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all">تراجع (Esc)</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ═══ EXPENSE MODAL ═══ */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div key="expense-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExpenseModalOpen(false)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"><Wallet size={20} /></div>
                  <h3 className="text-xl font-black text-amber-900 dark:text-amber-100">تسجيل مصروف مندوب</h3>
                </div>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-amber-400 hover:text-amber-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-1">المندوب *</label>
                  <div className="relative">
                    <input 
                      type="text" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 font-bold text-sm text-center outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white"
                      placeholder="ابحث عن المندوب..." value={expRepSearchQuery} onChange={e => setExpRepSearchQuery(e.target.value)}
                    />
                    {expRepSearchQuery && expenseForm.repName !== expRepSearchQuery && (
                      <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl mt-1 z-10 max-h-40 overflow-y-auto">
                        {reps.filter(r => r.toLowerCase().includes(expRepSearchQuery.toLowerCase())).map(r => (
                          <button key={r} onClick={() => { setExpenseForm({...expenseForm, repName: r}); setExpRepSearchQuery(r); }} className="w-full px-4 py-2 text-center font-bold text-xs hover:bg-amber-50 dark:hover:bg-amber-900/50 dark:text-white transition-colors">{r}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-1">التاريخ *</label>
                    <input type="date" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 font-bold text-sm text-center outline-none dark:text-white" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-1">المبلغ *</label>
                    <input type="number" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 font-black text-lg text-amber-600 text-center outline-none" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 mr-1">بيان المصروف (اشترى إيه؟) *</label>
                  <textarea className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white" rows={3} placeholder="مثال: فاتورة بنزين، صيانة إطار، شراء بضاعة..." value={expenseForm.statement} onChange={e => setExpenseForm({...expenseForm, statement: e.target.value})} />
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">إلغاء</button>
                <button onClick={handleSaveExpense} disabled={loading} className="flex-1 py-3.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                  {loading ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                  حفظ المصروف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SETTLEMENT WIZARD (Wizard/Reconciliation) ═══ */}
      <AnimatePresence>
        {isSettlementWizardOpen && (
          <div key="settlement-wizard" className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettlementWizardOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-white/10"
            >
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><CreditCard size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">قيد تسوية العهدة والتحصيل</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">المرحلة الثانية: تصفية المشتريات والمصاريف</p>
                  </div>
                </div>
                <button onClick={() => setIsSettlementWizardOpen(false)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">إجمالي السندات المختارة</span>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                        {filteredVouchers.filter(v => selectedVoucherIds.includes(v.id)).reduce((s, v) => s + v.amount, 0).toLocaleString()} <small className="text-xs">ر.س</small>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"><Banknote size={24} /></div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">مصروفات مختارة للخصم</span>
                      <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                        {repExpenses.filter(e => selectedExpenseIds.includes(e.id)).reduce((s, e) => s + e.amount, 0).toLocaleString()} <small className="text-xs">ر.س</small>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20"><Wallet size={24} /></div>
                  </div>
                </div>

                {/* Expenses List */}
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Info size={16} className="text-blue-500" />
                    المصاريف والمشتريات المعلقة للمندوبين المختارين
                  </h4>
                  <div className="grid gap-3">
                    {repExpenses.filter(e => !e.is_settled && selectedVoucherIds.some(vid => filteredVouchers.find(v => v.id === vid)?.repName === e.repName)).length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <AlertTriangle size={32} className="text-slate-200 mb-3" />
                        <p className="text-sm font-bold text-slate-400">لا توجد مصاريف معلقة لهذه المجموعة</p>
                      </div>
                    ) : (
                      repExpenses.filter(e => !e.is_settled && selectedVoucherIds.some(vid => filteredVouchers.find(v => v.id === vid)?.repName === e.repName)).map(exp => (
                        <div 
                          key={exp.id} 
                          onClick={() => setSelectedExpenseIds(prev => prev.includes(exp.id) ? prev.filter(id => id !== exp.id) : [...prev, exp.id])}
                          className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedExpenseIds.includes(exp.id) ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 shadow-lg shadow-amber-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-amber-200'}`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedExpenseIds.includes(exp.id) ? 'bg-amber-500 border-amber-500 scale-110 shadow-sm' : 'border-slate-300 dark:border-slate-600'}`}>
                              {selectedExpenseIds.includes(exp.id) && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">{exp.statement}</div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700">{formatDateToDisplay(exp.date)}</span>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{exp.repName}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xl font-black text-amber-600 tabular-nums">{exp.amount.toLocaleString()} <small className="text-[10px]">ر.س</small></div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-10 bg-slate-900 dark:bg-black border-t border-white/5 flex items-center justify-between shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">صافي التوريد (التحصيل - المصاريف)</span>
                  <div className="text-3xl font-black text-white mt-1 tabular-nums">
                    {(filteredVouchers.filter(v => selectedVoucherIds.includes(v.id)).reduce((s, v) => s + v.amount, 0) - 
                      repExpenses.filter(e => selectedExpenseIds.includes(e.id)).reduce((s, e) => s + e.amount, 0)).toLocaleString()} 
                    <small className="text-sm mr-1 text-slate-400 font-readex">ر.س</small>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSettlementWizardOpen(false)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-white transition-colors">إلغاء</button>
                  <button 
                    disabled={loading}
                    onClick={async () => {
                      handlePrintSettlement();
                      setTimeout(() => {
                        const confirmed = window.confirm('هل قمت بطباعة القيد وتأكدت من استلام المبلغ؟ سيتم الآن ترحيل هذه العناصر للأرشيف.');
                        if (confirmed) handleFinalSettlement();
                      }, 1000);
                    }} 
                    className="px-10 py-4 rounded-2xl font-black text-slate-900 bg-white hover:bg-emerald-50 hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <Clock size={20} className="animate-spin" /> : <Printer size={20} />}
                    طباعة واعتماد التسوية النهائية
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function handlePrintSettlement() {
    const selVouchers = filteredVouchers.filter(v => selectedVoucherIds.includes(v.id));
    const selExpenses = repExpenses.filter(e => selectedExpenseIds.includes(e.id));
    const totalColl = selVouchers.reduce((s, v) => s + v.amount, 0);
    const totalExp = selExpenses.reduce((s, e) => s + e.amount, 0);
    const net = totalColl - totalExp;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const voucherRows = selVouchers.map((v, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td class="text-center">${formatDateToDisplay(v.date)}</td>
        <td class="font-bold">${v.repName}</td>
        <td>${v.customerName}</td>
        <td class="text-center">${v.voucherNo}</td>
        <td class="text-center font-bold text-emerald">${v.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    const expenseRows = selExpenses.map((e, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td class="text-center">${formatDateToDisplay(e.date)}</td>
        <td class="font-bold">${e.statement}</td>
        <td class="text-center font-bold text-amber">${e.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <html dir="rtl">
        <head>
          <title>قيد تسوية وتوريد عهدة</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 4px solid #0f172a; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: 900; color: #0f172a; }
            .meta { text-align: left; font-size: 14px; font-weight: bold; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #64748b; font-weight: 900; }
            td { border: 1px solid #e2e8f0; padding: 12px; }
            .section-title { font-size: 16px; font-weight: 900; margin-bottom: 15px; color: #0f172a; border-right: 4px solid #279489; padding-right: 12px; }
            .text-emerald { color: #059669; }
            .text-amber { color: #d97706; }
            .summary-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 20px; padding: 30px; margin-top: 40px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
            .summary-row:last-child { border: none; padding-top: 15px; }
            .net-box { font-size: 24px; font-weight: 900; color: #0f172a; }
            .footer-sigs { margin-top: 80px; display: flex; justify-content: space-around; font-weight: 900; color: #64748b; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">قيد تسوية وتوريد عهدة</div>
            <div class="meta">تاريخ القيد: ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>

          <div class="section-title">أولاً: محصلات سندات القبض</div>
          <table>
            <thead>
              <tr><th width="5%">م</th><th width="15%">التاريخ</th><th width="20%">المندوب</th><th width="25%">العميل</th><th width="15%">رقم السند</th><th width="20%">المبلغ</th></tr>
            </thead>
            <tbody>${voucherRows}</tbody>
            <tfoot><tr><td colspan="5" style="text-align:left; font-weight:900;">إجمالي التحصيل النقدي:</td><td class="text-emerald" style="font-weight:900; text-align:center;">${totalColl.toLocaleString()} ر.س</td></tr></tfoot>
          </table>

          ${selExpenses.length > 0 ? `
            <div class="section-title">ثانياً: مصروفات ومشتريات المندوبين مخصومة من العهدة</div>
            <table>
              <thead>
                <tr><th width="5%">م</th><th width="15%">التاريخ</th><th width="65%">بيان المصروف</th><th width="15%">المبلغ</th></tr>
              </thead>
              <tbody>${expenseRows}</tbody>
              <tfoot><tr><td colspan="3" style="text-align:left; font-weight:900;">إجمالي المصروفات المخصومة:</td><td class="text-amber" style="font-weight:900; text-align:center;">${totalExp.toLocaleString()} ر.س</td></tr></tfoot>
            </table>
          ` : ''}

          <div class="summary-card">
            <div class="summary-row"><span>إجمالي التحصيل النقدي</span><span class="text-emerald">${totalColl.toLocaleString()} ر.س</span></div>
            <div class="summary-row"><span>إجمالي المصروفات والمشتريات (يُخصم)</span><span class="text-amber">(${totalExp.toLocaleString()}) ر.س</span></div>
            <div class="summary-row net-box"><span>صافي المبلغ المورد للفرع</span><span>${net.toLocaleString()} ر.س</span></div>
          </div>

          <div class="footer-sigs">
            <div>توقيع المندوب / المحصل: ..........................</div>
            <div>توقيع المحاسب المستلم: ..........................</div>
            <div>توقيع مدير الفرع: ..........................</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
