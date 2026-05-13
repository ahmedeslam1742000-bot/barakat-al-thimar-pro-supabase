import React from 'react';
import { 
  AlertTriangle, Trash2, RefreshCw, CheckCircle, 
  Box, FileText, Pencil 
} from 'lucide-react';
import ModalWrapper from '../../components/common/ModalWrapper';

/* ═══════════════════════════════════════════════════════════════════
   VoucherModals Component
   Houses all confirmation dialogs and the detailed view popup.
═══════════════════════════════════════════════════════════════════ */

export default function VoucherModals({
  kind, cfg, loading,
  isDeleteOpen, setIsDeleteOpen, handleDeleteSubmit,
  isDeleteGroupOpen, setIsDeleteGroupOpen, groupToDelete, setGroupToDelete, handleDeleteGroupSubmit,
  isResetConfirmOpen, setIsResetConfirmOpen, handleResetStatusSubmit,
  isConfirmCloseOpen, setIsConfirmCloseOpen, closeAddModal,
  isConfirmSaveOpen, setIsConfirmSaveOpen, executeSave,
  expandedGroupId, setExpandedGroupId, voucherGroups
}) {
  return (
    <>
      {/* ── Confirm Delete Line ── */}
      <ModalWrapper
        title="تأكيد حذف السطر"
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSubmit={handleDeleteSubmit}
        maxWidth="max-w-md"
        height="h-auto"
        submitLabel="نعم، احذف السطر"
        loading={loading}
        accent="rose"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4">
            <AlertTriangle size={40} />
          </div>
          <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">هل أنت متأكد؟</h4>
          <p className="text-slate-500 dark:text-slate-400 font-bold">سيتم حذف هذا الصنف من السند نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
        </div>
      </ModalWrapper>

      {/* ── Confirm Delete Group (Voucher) ── */}
      <ModalWrapper
        title="حذف السند بالكامل"
        isOpen={isDeleteGroupOpen}
        onClose={() => {
          setIsDeleteGroupOpen(false);
          setGroupToDelete(null);
        }}
        onSubmit={handleDeleteGroupSubmit}
        maxWidth="max-w-md"
        height="h-auto"
        submitLabel="نعم، احذف السند كاملاً"
        loading={loading}
        accent="rose"
      >
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-2">
            <Trash2 size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">حذف السند رقم {groupToDelete?.voucherCode}</h4>
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              سيتم إلغاء السند وجميع أسطره الملحقة به ({groupToDelete?.lineCount} أصناف). سيتم إرجاع كافة الكميات للمخزن تلقائياً وسيبقى السند في السجلات كـ "ملغي".
            </p>
          </div>
        </div>
      </ModalWrapper>

      {/* ── Reset Status Confirmation ── */}
      <ModalWrapper
        title="إلغاء فوترة السند"
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onSubmit={handleResetStatusSubmit}
        maxWidth="max-w-md"
        submitLabel="إلغاء الفوترة وفتح السند"
        loading={loading}
        accent="orange"
        height="h-auto"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-inner">
            <RefreshCw size={32} className="animate-spin-slow" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">هل تريد إلغاء فوترة هذا السند؟</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed">
            هذا السند تم إصدار فاتورة له مسبقاً. إلغاء الفوترة سيقوم بفتحه للتعديل أو الحذف، وسيحذف سجل التاريخ الخاص بالفاتورة المرتبطة به.
          </p>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-400">
             * فك القفل نفسه لا يغير المخزن، ولكن أي تعديل تجريه على السند لاحقاً سيحدث المخزن تلقائياً.
          </div>
        </div>
      </ModalWrapper>

      {/* ── Confirm Close Editor ── */}
      <ModalWrapper
        title="تأكيد الخروج"
        isOpen={isConfirmCloseOpen}
        onClose={() => setIsConfirmCloseOpen(false)}
        onSubmit={(e) => { e.preventDefault(); closeAddModal(); }}
        maxWidth="max-w-md"
        height="h-auto"
        submitLabel="تجاهل التعديلات والخروج"
        loading={false}
        accent="rose"
      >
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-5 border border-rose-100 dark:border-rose-500/20 shadow-inner">
            <AlertTriangle size={36} className="animate-pulse" />
          </div>
          <h4 className="text-xl font-black text-slate-800 dark:text-white mb-3 font-tajawal">هل تود الخروج بدون حفظ؟</h4>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-4">
            لديك تعديلات معلقة في مسودة السند لم يتم حفظها بعد. الخروج الآن سيؤدي إلى فقدان هذه التغييرات نهائياً.
          </p>
          <div className="mt-5 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            اضغط Enter للتأكيد • Esc للإلغاء
          </div>
        </div>
      </ModalWrapper>

      {/* ── Confirm Save Voucher ── */}
      <ModalWrapper
        title="تأكيد حفظ السند"
        isOpen={isConfirmSaveOpen}
        onClose={() => setIsConfirmSaveOpen(false)}
        onSubmit={executeSave}
        maxWidth="max-w-md"
        height="h-auto"
        submitLabel="تأكيد وحفظ البيانات"
        loading={loading}
        accent={cfg.accent}
      >
        <div className="flex flex-col items-center text-center py-6">
          <div className={`w-20 h-20 bg-${cfg.accent}-50 dark:bg-${cfg.accent}-500/10 rounded-full flex items-center justify-center text-${cfg.accent}-500 mb-5 border border-${cfg.accent}-100 dark:border-${cfg.accent}-500/20 shadow-inner`}>
            <CheckCircle size={36} />
          </div>
          <h4 className="text-xl font-black text-slate-800 dark:text-white mb-3 font-tajawal">هل أنت متأكد من الحفظ؟</h4>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-4">
            سيتم تسجيل كافة الأصناف المدخلة وتحديث المخزون بناءً على نوع هذا السند. يرجى مراجعة البيانات قبل التأكيد.
          </p>
        </div>
      </ModalWrapper>

      {/* ── Details Popup Modal ── */}
      <ModalWrapper
        title={expandedGroupId ? (() => {
          const g = voucherGroups.find(x => x.groupId === expandedGroupId);
          if (!g) return 'تفاصيل السند';
          const typeLabel = kind === 'in' ? 'إدخال' : 'إخراج';
          const partyLabel = kind === 'in' ? 'المورد' : 'المستفيد';
          const partyName = kind === 'in' ? g.supplier : g.rep;
          return `تفاصيل سند ${typeLabel} - ${partyLabel}: ${partyName || '—'}`;
        })() : 'تفاصيل السند'}
        isOpen={!!expandedGroupId}
        onClose={() => setExpandedGroupId(null)}
        maxWidth="max-w-5xl"
        height="h-auto"
        hideFooter={true}
        accent={cfg.accent}
      >
        {expandedGroupId && (() => {
          const g = voucherGroups.find(x => x.groupId === expandedGroupId);
          if (!g) return null;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">رقم السند</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{g.voucherCode || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">تاريخ السند</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{g.date}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">إجمالي القطع</p>
                  <p className="text-sm font-black text-primary">{g.lines.filter(l => !l.is_summary).reduce((sum, l) => sum + Number(l.qty || 0), 0)}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                    <tr>
                      <th className="px-4 py-3 text-center w-10">م</th>
                      <th className="px-4 py-3">اسم الصنف</th>
                      <th className="px-4 py-3">الشركة</th>
                      <th className="px-4 py-3 text-center">الكمية</th>
                      <th className="px-4 py-3 text-center">القسم</th>
                      <th className="px-4 py-3 text-center">وحدة القياس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {g.lines.filter(l => !l.is_summary).map((l, idx) => (
                      <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors font-bold">
                        <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{l.item}</td>
                        <td className="px-4 py-3 text-slate-500">{l.company || '—'}</td>
                        <td className="px-4 py-3 text-center font-black text-emerald-600 tabular-nums">{l.qty}</td>
                        <td className="px-4 py-3 text-center text-slate-500 text-[10px]">{l.cat || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-500 text-[10px]">{l.unit || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </ModalWrapper>
    </>
  );
}
