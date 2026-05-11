import{o as e}from"./chunk-zsgVPwQN.js";import{a as t,n,r,t as i}from"./supabaseClient-DsOYrrTe.js";import{t as a}from"./calendar-TyjVmK4w.js";import{n as o,r as s,t as c}from"./hash-DUdvHxKR.js";import{t as ee}from"./info-_-r8Trg3.js";import{t as te}from"./pencil-B2Pg5wfD.js";import{n as l,t as ne}from"./trash-2-B0-6Dnct.js";import{t as re}from"./printer-DcrwwNhn.js";import{t as u}from"./search-DMka7NUM.js";import{t as d}from"./triangle-alert-Dx3xhdQj.js";import{t as ie}from"./users-CyXyew4H.js";import{C as f,E as p,T as m,b as h,c as g,g as ae,l as oe,r as _}from"./index-Cr_qglsw.js";var v=n(`calendar-check`,[[`path`,{d:`M8 2v4`,key:`1cmpym`}],[`path`,{d:`M16 2v4`,key:`4m81vk`}],[`rect`,{width:`18`,height:`18`,x:`3`,y:`4`,rx:`2`,key:`1hopcy`}],[`path`,{d:`M3 10h18`,key:`8toen8`}],[`path`,{d:`m9 16 2 2 4-4`,key:`19s6y9`}]]),se=n(`credit-card`,[[`rect`,{width:`20`,height:`14`,x:`2`,y:`5`,rx:`2`,key:`ynyp8z`}],[`line`,{x1:`2`,x2:`22`,y1:`10`,y2:`10`,key:`1b3vmo`}]]),y=n(`landmark`,[[`path`,{d:`M10 18v-7`,key:`wt116b`}],[`path`,{d:`M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z`,key:`1m329m`}],[`path`,{d:`M14 18v-7`,key:`vav6t3`}],[`path`,{d:`M18 18v-7`,key:`aexdmj`}],[`path`,{d:`M3 22h18`,key:`8prr45`}],[`path`,{d:`M6 18v-7`,key:`1ivflk`}]]),b=n(`wallet`,[[`path`,{d:`M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1`,key:`18etb6`}],[`path`,{d:`M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4`,key:`xoc0q4`}]]),x=e(t()),S=r(),C=e=>{if(!e)return``;let[t,n,r]=e.split(`-`);return`${r}/${n}/${t}`};function w({setActiveView:e}){let[t,n]=(0,x.useState)(!1),[r,w]=(0,x.useState)(``),[T,E]=(0,x.useState)(!1),[D,O]=(0,x.useState)(!1),[k,A]=(0,x.useState)(!1),[j,M]=(0,x.useState)(null),[N,P]=(0,x.useState)(null),[F,ce]=(0,x.useState)([]),[I,L]=(0,x.useState)(``),[R,z]=(0,x.useState)(!1),B={date:``,repName:``,customerName:``,amount:``,type:`نقدي`,invoiceNo:``,voucherNo:``,isAccountPayment:!1},[V,H]=(0,x.useState)(B),[U,W]=(0,x.useState)([]),G=async()=>{let{data:e,error:t}=await i.from(`receipt_vouchers`).select(`*`).order(`created_at`,{ascending:!1});t?console.error(`❌ fetchVouchers error:`,t):W((e||[]).map(e=>({id:e.id,date:e.date,repName:e.rep_name,customerName:e.customer_name,voucherNo:e.voucher_no,invoiceNo:e.invoice_no||``,isAccountPayment:!e.invoice_no||e.invoice_no===`دفعة من الحساب`,amount:Number(e.amount),type:e.type,is_deposited:e.is_deposited||!1,deposited_at:e.deposited_at||null})))},K=async(e,t)=>{try{let n={is_deposited:!t,deposited_at:t?null:new Date().toISOString()},{error:r}=await i.from(`receipt_vouchers`).update(n).eq(`id`,e);if(r)throw r;_.success(t?`تم استرجاع السند للخزينة ↩️`:`تم تسجيل الإيداع بالبنك ✅`),await G(),N&&N.id===e&&P(e=>({...e,is_deposited:!t,deposited_at:n.deposited_at}))}catch(e){console.error(`❌ toggleDepositStatus error:`,e),_.error(`حدث خطأ أثناء تغيير الحالة. (يرجى التأكد من إضافة حقل is_deposited و deposited_at)`)}};(0,x.useEffect)(()=>{G();let e=i.channel(`public:receipt_vouchers`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`receipt_vouchers`},G).subscribe();return()=>i.removeChannel(e)},[]);let q=(0,x.useMemo)(()=>U.filter(e=>(e.voucherNo||``).includes(r)||(e.repName||``).includes(r)||(e.customerName||``).includes(r)),[U,r]),J=(0,x.useMemo)(()=>{let{repName:e,...t}=V;return JSON.stringify(t)!==JSON.stringify({date:``,customerName:``,amount:``,type:`نقدي`,invoiceNo:``,voucherNo:``,isAccountPayment:!1})||I!==``},[V,I]);(0,x.useEffect)(()=>{(async()=>{let{data:e}=await i.from(`reps`).select(`name`).order(`name`);e&&ce(e)})()},[]);let Y=(0,x.useMemo)(()=>{if(!I)return F;let e=I.toLowerCase();return F.filter(t=>t.name.toLowerCase().includes(e))},[F,I]),X=()=>{let e=I||V.repName,t={...V,repName:e},n=[`date`,`repName`,`customerName`,`amount`,`type`,`voucherNo`];t.isAccountPayment||n.push(`invoiceNo`);for(let e of n)if(!t[e]){_.error(`يرجى إكمال الحقل: ${fe(e)}`);return}if(!F.some(t=>t.name===e)){_.error(`يرجى اختيار مندوب صالح من القائمة`);return}A(!0)},Z=async()=>{let e=I||V.repName;n(!0);try{let t={date:V.date,rep_name:e,customer_name:V.customerName,voucher_no:V.voucherNo,invoice_no:V.isAccountPayment?`دفعة من الحساب`:V.invoiceNo||``,amount:Number(V.amount),type:V.type};if(j){let{error:e}=await i.from(`receipt_vouchers`).update(t).eq(`id`,j);if(e)throw e;_.success(`✅ تم التعديل بنجاح`)}else{let{error:e}=await i.from(`receipt_vouchers`).insert([t]);if(e)throw e;_.success(`✅ تم حفظ السند بنجاح`)}await G()}catch(e){console.error(`❌ confirmSave error:`,e),_.error(`خطأ في الحفظ: ${e?.message||`حدث خطأ غير متوقع`}`)}finally{n(!1),A(!1),E(!1),H(B),L(``),M(null)}},Q=()=>{J?O(!0):E(!1)},$=()=>{O(!1),E(!1),H(B),L(``),M(null)},le=e=>{H({date:e.date,repName:e.repName,customerName:e.customerName,amount:e.amount,type:e.type,invoiceNo:e.invoiceNo===`دفعة من الحساب`?``:e.invoiceNo,voucherNo:e.voucherNo,isAccountPayment:e.isAccountPayment}),L(e.repName),M(e.id),E(!0)},ue=()=>{let e=window.open(``,`_blank`);if(!e){_.error(`لم نتمكن من فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك.`);return}let t=q.reduce((e,t)=>(e[t.type]||(e[t.type]=[]),e[t.type].push(t),e),{}),n=``,r=0;[`نقدي`,`شبكة`].forEach(e=>{let i=t[e];if(!i||i.length===0)return;let a=i.reduce((e,t)=>e+Number(t.amount||0),0);r+=a;let o=i.map((t,n)=>`
        <tr>
          <td class="text-center">${n+1}</td>
          <td>${C(t.date)}</td>
          <td class="font-bold">${t.repName}</td>
          <td>${t.customerName}</td>
          <td class="text-center">${t.voucherNo}</td>
          <td class="text-center">${t.invoiceNo}</td>
          <td class="text-center font-bold text-emerald">${t.amount.toLocaleString()} ر.س</td>
          <td class="text-center"><span class="badge ${e===`نقدي`?`badge-cash`:e===`شبكة`?`badge-card`:`badge-transfer`}">${t.type}</span></td>
        </tr>
      `).join(``);n+=`
        <div class="section-title">محصلات الدفع: ${e}</div>
        <table>
          <thead>
            <tr>
              <th width="5%">م</th>
              <th width="12%">التاريخ</th>
              <th width="18%">المندوب</th>
              <th width="18%">العميل</th>
              <th width="12%">رقم السند</th>
              <th width="12%">رقم الفاتورة</th>
              <th width="15%">المبلغ</th>
              <th width="8%">نوع التحصيل</th>
            </tr>
          </thead>
          <tbody>
            ${o}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" class="text-left font-bold" style="padding-left: 20px;">إجمالي (${e}):</td>
              <td class="text-center font-black text-emerald" style="font-size: 14px;">${a.toLocaleString()} ر.س</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `});let i=`
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
              <div class="meta-item">تاريخ الإصدار: <span>${new Date().toLocaleDateString(`ar-SA`)}</span></div>
            </div>
          </div>
          
          ${n||`<div class="text-center" style="padding: 40px; color: var(--text-muted);">لا توجد بيانات للعرض</div>`}
          
          <script>
            window.onload = () => {
              window.print();
            };
            window.onafterprint = () => {
              window.close();
            };
          <\/script>
        </body>
      </html>
    `;e.document.write(i),e.document.close()},de=async e=>{try{let{error:t}=await i.from(`receipt_vouchers`).delete().eq(`id`,e);if(t)throw t;_.success(`تم الحذف بنجاح`),await G()}catch(e){console.error(`❌ handleDelete error:`,e),_.error(`خطأ أثناء الحذف`)}};(0,x.useEffect)(()=>{let e=e=>{!T&&!D&&!k&&!N||(e.key===`Escape`&&(k?A(!1):D?O(!1):N?P(null):Q()),e.key===`Enter`&&(k?Z():D?$():T&&!R&&X()))};return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},[T,k,D,J,V,R,I,F]);let fe=e=>({date:`التاريخ`,repName:`اسم المندوب`,customerName:`اسم العميل`,amount:`المبلغ`,type:`نوع التحصيل`,invoiceNo:`رقم الفاتورة`,voucherNo:`رقم السند`})[e]||e;return(0,S.jsxs)(`div`,{className:`h-full flex flex-col p-4 md:p-8 bg-[#f8fafc] dark:bg-slate-950 font-readex overflow-hidden`,dir:`rtl`,children:[(0,S.jsxs)(`div`,{className:`flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-4 shrink-0`,children:[(0,S.jsx)(`div`,{className:`w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-600/20 border border-white/20`,children:(0,S.jsx)(f,{size:28,className:`text-white drop-shadow-lg`})}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`h1`,{className:`text-2xl font-black text-slate-800 dark:text-white tracking-tight`,children:`سندات القبض`}),(0,S.jsxs)(`div`,{className:`flex items-center gap-2 mt-0.5`,children:[(0,S.jsx)(`span`,{className:`w-2 h-2 rounded-full bg-emerald-500`}),(0,S.jsx)(`span`,{className:`text-[10px] font-black text-slate-400 uppercase tracking-widest`,children:`إدارة التحصيل المالي`})]})]})]}),(0,S.jsxs)(`div`,{className:`flex-1 flex flex-col sm:flex-row items-center gap-3 max-w-4xl`,children:[(0,S.jsxs)(`div`,{className:`relative flex-1 w-full group`,children:[(0,S.jsx)(u,{className:`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors`,size:18}),(0,S.jsx)(`input`,{type:`text`,placeholder:`البحث برقم السند، اسم المندوب، أو العميل...`,className:`w-full h-12 pr-11 pl-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all outline-none shadow-sm`,value:r,onChange:e=>w(e.target.value)})]}),(0,S.jsxs)(`button`,{className:`h-12 px-5 flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-800 shadow-sm shrink-0`,children:[(0,S.jsx)(a,{size:16,className:`text-emerald-500`}),(0,S.jsx)(`span`,{className:`hidden sm:inline`,children:`تصفية بالتاريخ`})]})]}),(0,S.jsxs)(`div`,{className:`flex items-center gap-2 shrink-0`,children:[(0,S.jsxs)(`button`,{onClick:()=>{H(B),L(``),M(null),E(!0)},className:`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all group`,children:[(0,S.jsx)(l,{size:18,className:`group-hover:rotate-90 transition-transform duration-300`}),(0,S.jsx)(`span`,{children:`إنشاء سند جديد`})]}),(0,S.jsx)(`button`,{onClick:ue,className:`p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-emerald-500 transition-all shadow-sm`,children:(0,S.jsx)(re,{size:20})}),(0,S.jsx)(`button`,{onClick:()=>e&&e(`dashboard`),title:`العودة للرئيسية`,className:`flex items-center justify-center w-11 h-11 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl transition-all hover:bg-rose-100 hover:scale-105 active:scale-95`,children:(0,S.jsx)(ae,{size:20,strokeWidth:2.5,className:`rotate-180`})})]})]}),(0,S.jsx)(`div`,{className:`flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden`,children:(0,S.jsx)(`div`,{className:`flex-1 overflow-auto custom-scrollbar`,children:(0,S.jsxs)(`table`,{className:`w-full text-right border-separate border-spacing-0`,children:[(0,S.jsx)(`thead`,{className:`sticky top-0 z-10`,children:(0,S.jsxs)(`tr`,{children:[(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 w-16 text-center`,children:`م`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700`,children:`التاريخ`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700`,children:`اسم المندوب`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700`,children:`اسم العميل`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700`,children:`رقم السند`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700`,children:`رقم الفاتورة`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center`,children:`المبلغ`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center`,children:`نوع التحصيل`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center`,children:`حالة الإيداع`}),(0,S.jsx)(`th`,{className:`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md px-6 py-4 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 text-center w-24`,children:`الإجراء`})]})}),(0,S.jsx)(`tbody`,{className:`divide-y divide-slate-50 dark:divide-slate-800`,children:q.map((e,t)=>(0,S.jsxs)(`tr`,{style:{animationDelay:`${t*.05}s`,opacity:0},className:`animate-fade-in-up group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors`,children:[(0,S.jsx)(`td`,{className:`px-6 py-5 text-center text-xs font-black text-slate-400 group-hover:text-emerald-500 transition-colors`,children:t+1}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-xs font-bold text-slate-700 dark:text-white`,children:C(e.date)}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-xs font-black text-slate-700 dark:text-white truncate`,children:e.repName}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300`,children:e.customerName}),(0,S.jsx)(`td`,{className:`px-6 py-5`,children:(0,S.jsx)(`span`,{className:`px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black border border-slate-200/50 dark:border-slate-700`,children:e.voucherNo})}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400`,children:e.invoiceNo===`دفعة من الحساب`?(0,S.jsx)(`span`,{className:`text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-black`,children:`دفعة من الحساب`}):e.invoiceNo}),(0,S.jsxs)(`td`,{className:`px-6 py-5 text-center text-sm font-black text-emerald-600 dark:text-emerald-400`,children:[e.amount.toLocaleString(),` `,(0,S.jsx)(`small`,{className:`text-[10px]`,children:`ر.س`})]}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-center`,children:(0,S.jsx)(`span`,{className:`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black 
                      ${e.type===`نقدي`?`bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`:e.type===`شبكة`?`bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`:`bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400`}`,children:e.type})}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-center`,children:(0,S.jsx)(`div`,{className:`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border ${e.is_deposited?`bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50`:`bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50`}`,children:e.is_deposited?(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(y,{size:12}),` تم الإيداع`]}):(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(b,{size:12}),` في الخزينة`]})})}),(0,S.jsx)(`td`,{className:`px-6 py-5 text-center`,children:(0,S.jsxs)(`div`,{className:`flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`,children:[(0,S.jsx)(`button`,{onClick:()=>P(e),className:`p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all`,title:`تفاصيل السند (للإيداع)`,children:(0,S.jsx)(o,{size:16})}),(0,S.jsx)(`button`,{onClick:()=>le(e),className:`p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all`,title:`تعديل`,children:(0,S.jsx)(te,{size:16})}),(0,S.jsx)(`button`,{onClick:()=>de(e.id),className:`p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all`,title:`مسح`,children:(0,S.jsx)(ne,{size:16})})]})})]},e.id))})]})})}),(0,S.jsx)(p,{children:T&&(0,S.jsxs)(`div`,{className:`fixed inset-0 z-[100] flex items-center justify-center p-4`,children:[(0,S.jsx)(m.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:Q,className:`absolute inset-0 bg-slate-950/40 backdrop-blur-md`}),(0,S.jsxs)(m.div,{initial:{opacity:0,scale:.9,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.9,y:20},className:`relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]`,children:[(0,S.jsxs)(`div`,{className:`p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,S.jsx)(`div`,{className:`w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20`,children:(0,S.jsx)(l,{size:20,className:`text-white`})}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`h2`,{className:`text-lg font-black text-slate-800 dark:text-white`,children:j?`تعديل سند قبض`:`إنشاء سند قبض جديد`}),(0,S.jsx)(`p`,{className:`text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5`,children:`تعبئة بيانات التحصيل المالي`})]})]}),(0,S.jsx)(`button`,{onClick:Q,className:`w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm`,children:(0,S.jsx)(g,{size:18})})]}),(0,S.jsx)(`div`,{className:`p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-900/30`,children:(0,S.jsxs)(`div`,{className:`space-y-5`,children:[(0,S.jsx)(`div`,{className:`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm relative`,children:(0,S.jsxs)(`div`,{className:`grid grid-cols-1 md:grid-cols-4 gap-4`,children:[(0,S.jsxs)(`div`,{className:`md:col-span-1`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`التاريخ `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(a,{className:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500`,size:16}),(0,S.jsx)(`input`,{type:`date`,required:!0,className:`w-full h-10 pr-9 pl-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 dark:text-white`,value:V.date,onChange:e=>H({...V,date:e.target.value})})]})]}),(0,S.jsxs)(`div`,{className:`md:col-span-1`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`رقم السند `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(c,{className:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500`,size:16}),(0,S.jsx)(`input`,{type:`text`,required:!0,className:`w-full h-10 pr-9 pl-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-700 dark:text-white`,placeholder:`1001`,value:V.voucherNo,onChange:e=>H({...V,voucherNo:e.target.value})})]})]}),(0,S.jsxs)(`div`,{className:`md:col-span-1`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`العميل `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(ie,{className:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500`,size:16}),(0,S.jsx)(`input`,{type:`text`,required:!0,className:`w-full h-10 pr-9 pl-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 dark:text-white`,placeholder:`اسم العميل...`,value:V.customerName,onChange:e=>H({...V,customerName:e.target.value})})]})]}),(0,S.jsxs)(`div`,{className:`md:col-span-1 relative`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`المندوب `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(oe,{className:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500`,size:16}),(0,S.jsx)(`input`,{type:`text`,required:!0,autoComplete:`off`,className:`w-full h-10 pr-9 pl-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 dark:text-white`,placeholder:`ابحث...`,value:I,onFocus:()=>z(!0),onBlur:()=>setTimeout(()=>z(!1),200),onChange:e=>{L(e.target.value),z(!0)}})]}),(0,S.jsx)(p,{children:R&&(0,S.jsx)(m.div,{initial:{opacity:0,y:5},animate:{opacity:1,y:0},exit:{opacity:0,y:5},className:`absolute z-20 top-[calc(100%+5px)] right-0 left-0 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto custom-scrollbar p-1`,children:Y.length>0?Y.map((e,t)=>(0,S.jsx)(`button`,{type:`button`,onMouseDown:t=>{t.preventDefault(),L(e.name),z(!1)},className:`w-full text-right px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all`,children:e.name},t)):(0,S.jsx)(`div`,{className:`px-3 py-2 text-[10px] font-bold text-slate-400 text-center`,children:`لا يوجد نتائج`})})})]})]})}),(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm relative`,children:[(0,S.jsx)(`div`,{className:`absolute -top-3 right-6 bg-white dark:bg-slate-800 px-3 text-[10px] font-black text-amber-600 dark:text-amber-500 tracking-wider uppercase`,children:`التفاصيل المالية والتحصيل`}),(0,S.jsxs)(`div`,{className:`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2`,children:[(0,S.jsxs)(`div`,{className:`lg:col-span-3`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`المبلغ المحصل `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(b,{className:`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500`,size:16}),(0,S.jsx)(`input`,{type:`number`,required:!0,step:`0.01`,className:`w-full h-10 pr-9 pl-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-emerald-600 dark:text-emerald-400`,placeholder:`0.00`,value:V.amount,onChange:e=>H({...V,amount:e.target.value})}),(0,S.jsx)(`span`,{className:`absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600/60 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800`,children:`ر.س`})]})]}),(0,S.jsxs)(`div`,{className:`lg:col-span-3`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5 text-center`,children:[`نوع التحصيل `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsx)(`div`,{className:`grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl`,children:[`نقدي`,`شبكة`].map(e=>(0,S.jsxs)(`button`,{type:`button`,onClick:()=>H({...V,type:e}),className:`h-8 rounded-lg font-black text-[10px] transition-all flex items-center justify-center gap-1.5 ${V.type===e?`bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-500/20`:`text-slate-400 hover:text-slate-500`}`,children:[e===`نقدي`?(0,S.jsx)(b,{size:12}):(0,S.jsx)(se,{size:12}),e]},e))})]}),(0,S.jsxs)(`div`,{className:`lg:col-span-3`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`نوع الارتباط `,(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>H({...V,isAccountPayment:!1}),className:`flex-1 py-2 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 ${V.isAccountPayment?`text-slate-400 hover:text-slate-600`:`bg-white dark:bg-slate-800 text-emerald-600 shadow-sm`}`,children:[(0,S.jsx)(h,{size:12}),`فاتورة`]}),(0,S.jsxs)(`button`,{type:`button`,onClick:()=>H({...V,isAccountPayment:!0,invoiceNo:``}),className:`flex-1 py-2 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 ${V.isAccountPayment?`bg-white dark:bg-slate-800 text-amber-600 shadow-sm`:`text-slate-400 hover:text-slate-600`}`,children:[(0,S.jsx)(ee,{size:12}),`من الحساب`]})]})]}),(0,S.jsxs)(`div`,{className:`lg:col-span-3 transition-all duration-300 ${V.isAccountPayment?`opacity-40`:``}`,children:[(0,S.jsxs)(`label`,{className:`block text-[10px] font-bold text-slate-500 mb-1.5`,children:[`رقم الفاتورة `,!V.isAccountPayment&&(0,S.jsx)(`span`,{className:`text-rose-500`,children:`*`})]}),(0,S.jsxs)(`div`,{className:`relative group`,children:[(0,S.jsx)(c,{className:`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${V.isAccountPayment?`text-slate-300`:`text-slate-400 group-focus-within:text-amber-500`}`,size:16}),(0,S.jsx)(`input`,{type:`text`,disabled:V.isAccountPayment,className:`w-full h-10 pr-9 pl-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-700 dark:text-white`,placeholder:V.isAccountPayment?`---`:`مثال: 5001`,value:V.isAccountPayment?``:V.invoiceNo,onChange:e=>H({...V,invoiceNo:e.target.value})})]})]})]})]})]})}),(0,S.jsxs)(`div`,{className:`p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3 shrink-0`,children:[(0,S.jsx)(`button`,{type:`button`,onClick:Q,className:`px-5 py-2.5 font-bold text-[11px] text-slate-500 hover:text-rose-500 transition-colors`,children:`إلغاء`}),(0,S.jsx)(`button`,{type:`button`,onClick:X,className:`px-10 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[11px] shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all`,children:j?`حفظ التعديلات`:`حفظ السند`})]})]})]},`main-modal`)}),(0,S.jsx)(p,{children:N&&(0,S.jsxs)(`div`,{className:`fixed inset-0 z-[150] flex items-center justify-center p-4`,children:[(0,S.jsx)(m.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>P(null),className:`absolute inset-0 bg-slate-950/40 backdrop-blur-md`}),(0,S.jsxs)(m.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},className:`relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col`,children:[(0,S.jsxs)(`div`,{className:`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0`,children:[(0,S.jsxs)(`div`,{className:`flex items-center gap-4`,children:[(0,S.jsx)(`div`,{className:`w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20`,children:(0,S.jsx)(h,{size:24,className:`text-white`})}),(0,S.jsxs)(`div`,{children:[(0,S.jsx)(`h2`,{className:`text-xl font-black text-slate-800 dark:text-white`,children:`تفاصيل سند القبض`}),(0,S.jsxs)(`p`,{className:`text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5`,children:[`سند رقم: `,N.voucherNo]})]})]}),(0,S.jsx)(`button`,{onClick:()=>P(null),className:`w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm`,children:(0,S.jsx)(g,{size:20})})]}),(0,S.jsxs)(`div`,{className:`p-8 bg-slate-50/30 dark:bg-slate-900/30 space-y-6`,children:[(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center`,children:[(0,S.jsx)(`span`,{className:`text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1`,children:`المبلغ المحصل`}),(0,S.jsxs)(`div`,{className:`text-3xl font-black text-emerald-600 dark:text-emerald-400`,children:[N.amount.toLocaleString(),` `,(0,S.jsx)(`span`,{className:`text-sm`,children:`ر.س`})]}),(0,S.jsxs)(`div`,{className:`mt-3 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600`,children:[`نوع التحصيل: `,N.type]})]}),(0,S.jsxs)(`div`,{className:`grid grid-cols-2 gap-4`,children:[(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700`,children:[(0,S.jsx)(`span`,{className:`block text-[10px] font-black text-slate-400 mb-1`,children:`التاريخ`}),(0,S.jsx)(`span`,{className:`font-bold text-slate-700 dark:text-white text-sm`,children:C(N.date)})]}),(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700`,children:[(0,S.jsx)(`span`,{className:`block text-[10px] font-black text-slate-400 mb-1`,children:`رقم الفاتورة`}),(0,S.jsx)(`span`,{className:`font-bold text-slate-700 dark:text-white text-sm`,children:N.invoiceNo})]}),(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700`,children:[(0,S.jsx)(`span`,{className:`block text-[10px] font-black text-slate-400 mb-1`,children:`اسم المندوب`}),(0,S.jsx)(`span`,{className:`font-black text-blue-600 dark:text-blue-400 text-sm`,children:N.repName})]}),(0,S.jsxs)(`div`,{className:`bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700`,children:[(0,S.jsx)(`span`,{className:`block text-[10px] font-black text-slate-400 mb-1`,children:`اسم العميل`}),(0,S.jsx)(`span`,{className:`font-bold text-slate-700 dark:text-white text-sm`,children:N.customerName})]})]}),(0,S.jsx)(`div`,{className:`mt-6 border-t border-slate-200 dark:border-slate-700 pt-6`,children:N.is_deposited?(0,S.jsxs)(`div`,{className:`bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 flex items-start gap-4`,children:[(0,S.jsx)(`div`,{className:`w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm`,children:(0,S.jsx)(s,{size:20})}),(0,S.jsxs)(`div`,{className:`flex-1 pt-0.5`,children:[(0,S.jsx)(`h4`,{className:`font-black text-emerald-800 dark:text-emerald-300 text-sm mb-1.5`,children:`تم إيداع السند بنجاح`}),(0,S.jsxs)(`p`,{className:`text-[11px] font-bold text-emerald-600 dark:text-emerald-400/80 flex items-center gap-1.5 mb-2`,children:[(0,S.jsx)(v,{size:14}),`بتاريخ: `,N.deposited_at?new Date(N.deposited_at).toLocaleString(`ar-EG`,{year:`numeric`,month:`long`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}):`غير مسجل`]}),(0,S.jsx)(`button`,{onClick:()=>K(N.id,!0),className:`text-[10px] font-bold text-slate-400 hover:text-rose-500 underline transition-colors`,title:`تراجع عن الإيداع`,children:`إلغاء الإيداع`})]})]}):(0,S.jsxs)(`button`,{onClick:()=>K(N.id,!1),className:`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`,children:[(0,S.jsx)(y,{size:20}),`تأكيد إيداع السند في البنك`]})})]})]})]},`view-modal`)}),(0,S.jsx)(p,{children:(D||k)&&(0,S.jsxs)(`div`,{className:`fixed inset-0 z-[200] flex items-center justify-center p-4`,children:[(0,S.jsx)(m.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>{O(!1),A(!1)},className:`absolute inset-0 bg-slate-950/20 backdrop-blur-sm`}),(0,S.jsxs)(m.div,{initial:{opacity:0,scale:.95},animate:{opacity:1,scale:1},exit:{opacity:0,scale:.95},className:`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 text-center`,children:[(0,S.jsx)(`div`,{className:`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${k?`bg-emerald-50 text-emerald-500`:`bg-rose-50 text-rose-500`}`,children:k?(0,S.jsx)(s,{size:32}):(0,S.jsx)(d,{size:32})}),(0,S.jsx)(`h3`,{className:`text-lg font-black text-slate-800 dark:text-white mb-2`,children:k?`تأكيد حفظ السند`:`إلغاء الإدخال؟`}),(0,S.jsx)(`p`,{className:`text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed`,children:k?`هل أنت متأكد من صحة كافة البيانات المدخلة وتريد حفظ السند الآن؟`:`لقد قمت بتغيير بعض البيانات، هل تريد الخروج دون حفظ التغييرات؟`}),(0,S.jsxs)(`div`,{className:`flex gap-3`,children:[(0,S.jsxs)(`button`,{type:`button`,onClick:()=>{k?Z():$()},className:`flex-1 py-3 rounded-xl font-black text-xs text-white shadow-lg ${k?`bg-emerald-600 shadow-emerald-500/20`:`bg-rose-600 shadow-rose-500/20`}`,children:[`نعم، `,k?`حفظ`:`خروج`,` (Enter)`]}),(0,S.jsx)(`button`,{type:`button`,onClick:()=>{O(!1),A(!1)},className:`flex-1 py-3 rounded-xl font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all`,children:`تراجع (Esc)`})]})]})]},`confirm-modal`)})]})}export{w as default};