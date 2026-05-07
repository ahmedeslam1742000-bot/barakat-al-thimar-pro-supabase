// ===================================================
// سكريبت إدخال الأصناف - بركة الثمار
// يُشغَّل مرة واحدة: node insert_items.mjs
// ===================================================

const SUPABASE_URL = "https://byrdvzxkotgkznbtkueu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmR2enhrb3Rna3puYnRrdWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MzY1NSwiZXhwIjoyMDkxODQ5NjU1fQ.Rg5Cz7rTe0AEqcFEq9OEw3I_AnyhIxlSvjfDJxW_iVU";

const items = [
  // ── مجمدات | كرتونه ──
  { name: "فراوله", company: "ماريتا", cat: "مجمدات", unit: "كرتونه" },
  { name: "رمان", company: "داري", cat: "مجمدات", unit: "كرتونه" },
  { name: "مانجو شرائح", company: "روفي", cat: "مجمدات", unit: "كرتونه" },
  { name: "فراوله 10كجم", company: "كيت", cat: "مجمدات", unit: "كرتونه" },
  { name: "فراوله", company: "بركة", cat: "مجمدات", unit: "كرتونه" },
  { name: "جوافة حب 10 كجم", company: "روفي", cat: "مجمدات", unit: "كرتونه" },
  { name: "مانجو حب مجمد 10 كجم", company: "روفي", cat: "مجمدات", unit: "كرتونه" },
  { name: "مانجو مطحون", company: "مونتانا", cat: "مجمدات", unit: "كرتونه" },
  { name: "مانجو مطحون", company: "بريمير", cat: "مجمدات", unit: "كرتونه" },
  { name: "جوافة مطحون", company: "بريمير", cat: "مجمدات", unit: "كرتونه" },
  { name: "جوافة مطحون", company: "مونتانا", cat: "مجمدات", unit: "كرتونه" },

  // ── بلاستيك | كرتونه ──
  { name: "مناديل ماكس رول 300 متر شد 6", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "حامل اكواب ثنائى شد 225", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "حامل اكواب رباعى شد 225", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "رول تغليف اكواب عصير مطبوع 3000 كوب", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مناديل مربعة 30*30 شد 40", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال دائرى 12 اونص شد 300", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال دائرى 16 اونص شد 300", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال دائرى 24 اونص شد 300", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال مربع 12 اونص شد 240 A", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال مربع 12 اونص شد 240 B", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال مربع 16 اونص شد 240", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "علب سلطة كريستال مربع 24 اونص شد 240", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جالون شفاف مستطيل 1 لتر مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جالون شفاف مستطيل 1.5 لتر مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جالون شفاف مستطيل 1 لتر بدون غطاء", company: "تغليف", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جالون شفاف مستطيل 1.5 لتر بدون غطاء", company: "تغليف", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون ابيض 1 لتر شد 24", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون ابيض 1.5 لتر شد 24", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون ابيض 2 لتر شد 18", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون عصير 3 لتر شد 12", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون عصير 5 لتر شد 12", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "جركين جالون عصير 10 لتر شد 12", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات مستطيل 100 مل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات 150 مل مستطيل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات مستطيل 200 مل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات مستطيل 250 مل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات مستطيل 330 مل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غرشات 500 مل مع الغطاء", company: "عسق", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص اسود 10مل طويل شد 2000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص اسود 8 مل شد 4000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص اسود 10 مل شد 4000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص ملون 6 مل شد 5000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص ملون 8 مل شد 4000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مصاص ملون 10 مل شد 4000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 10 شد 1000 s", company: "امداد", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 12 شد 1000 s", company: "امداد", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 16 شد 1000 s", company: "امداد", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 20 شد 1000 s", company: "امداد", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات صينى 12 اونص شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات صينى 16 اونص شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات اماراتي 12 اونص شد 1000", company: "كابكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات اماراتي 16 اونص شد 1000", company: "كابكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 10 اونص غطاء قبة", company: "ابيكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 12 اونص شد 1000 قبة", company: "ابيكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 16 اونص غطاء قبة", company: "ابيكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 10 اونص مع الغطاء شد 1000", company: "جاسكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 12 اونص مع الغطاء شد 1000", company: "جاسكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات 16 اونص مع الغطاء شد 1000", company: "جاسكو", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 002 شد 460", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 007 شد 320", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 009 شد 264", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 1100 شد 800", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 1103 شد 400", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اطباق سوشى 05 شد 400", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق ايس كريم اسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق ايس كريم ملون شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق ايس كريم شفاف شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "شوك حلا ملون شد 2000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق ايس كريم ملون vip شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "شوكة طعام اسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق طعام اسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق طعام HD اسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "شوكة طعام HD اسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "ملاعق مغلفة شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "شوكة مغلفة شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "سكين مغلف شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مجموعة طعام ملعقة وشوكة وسكينة ومنديل شد 500 A", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مجموعة طعام ملعقة وشوكة وسكينة ومنديل شد 500 B", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مجموعة طعام شوكة وسكين ومنديل شد 500", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "قفاز اسود لارج شد 700", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "قفاز شفاف لارج شد 700", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غطاء رأس أزرق شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غطاء رأس أسود شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "مريول مطبخ شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اكياس بلدية 70 جالون 10كجم", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اكياس بلدية 55 جالون 10 كجم", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "اكياس نفايات 90 جالون 10 كجم", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "بكرة فوط non-woven زرقاء 475 قطعة", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "غطاء كاسات صينى شد 1000", company: "MM", cat: "بلاستيك", unit: "كرتونه" },
  { name: "صحون مايكروويف غير مقسم C1 شد 250", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "صحون مايكروويف مقسم 2 شد 250", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات ماء ابيض شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات ماء شفافه شد 1000", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات تذوق ورقية 2.5 اونص", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },

  // ── تبريد | حبه ──
  { name: "نكهة موهيتو 5 لتر", company: "الفي", cat: "تبريد", unit: "حبه" },
  { name: "نكهة فراولة 750 مل", company: "الفي", cat: "تبريد", unit: "حبه" },

  // ── تبريد | شوال ──
  { name: "سكر سعودي ناعم 50 كجم", company: "-", cat: "تبريد", unit: "شوال" },

  // ── تبريد | شده ──
  { name: "حليب طويل الاجل شد 12", company: "-", cat: "تبريد", unit: "شده" },
  { name: "مزيج ايس كريم فانيليا شد 12", company: "الري", cat: "تبريد", unit: "شده" },
  { name: "مزيج ايس كريم فراوله شد 12", company: "الري", cat: "تبريد", unit: "شده" },
  { name: "مزيج ايس كريم مانجو شد 12", company: "الري", cat: "تبريد", unit: "شده" },
  { name: "مزيج ايس كريم شوكولاته شد 12", company: "الري", cat: "تبريد", unit: "شده" },
  { name: "مزيج ايس كريم فستق شد 12", company: "الري", cat: "تبريد", unit: "شده" },

  // ── تبريد | سطل ──
  { name: "حشوة شوكولاتة نوتيلا 5 كجم", company: "ستار دوبلن", cat: "تبريد", unit: "سطل" },
  { name: "حشوة فستق حلبى 17% 5 كجم", company: "لوفا", cat: "تبريد", unit: "سطل" },
  { name: "لوتس 5 كجم", company: "ارما", cat: "تبريد", unit: "سطل" },
  { name: "حشوة شوكولاتة بيضاء 5 كجم", company: "لوفا", cat: "تبريد", unit: "سطل" },
  { name: "حشوة شوكولاته بوينو كندر 5 كجم", company: "لوفا", cat: "تبريد", unit: "سطل" },

  // ── بلاستيك | كرتونه (آخر المجموعات 110-112) ──
  { name: "كاسات دائرية غطاء اسود 360 مل شد 500", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات دائرية غطاء اسود 500 مل شد 500", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },
  { name: "كاسات دائرية غطاء اسود 700 مل شد 500", company: "فاين", cat: "بلاستيك", unit: "كرتونه" },

  // ── بلاستيك | شده ──
  { name: "صندوق فلين ابيض دائرى كبير شد 8", company: "-", cat: "بلاستيك", unit: "شده" },
  { name: "صندوق فلين دائرى ابيض وسط شد 10", company: "-", cat: "بلاستيك", unit: "شده" },
];

async function insertItems() {
  console.log(`\n🚀 بدء إدخال ${items.length} صنف إلى قاعدة البيانات...\n`);

  // Fetch existing products to avoid duplicates
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=name,company`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  const existing = await existingRes.json();
  const existingSet = new Set(existing.map(p => `${p.name}||${p.company}`));
  console.log(`✅ تم تحميل ${existing.length} صنف موجود مسبقاً.\n`);

  let added = 0, skipped = 0, errors = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = `${item.name}||${item.company}`;

    if (existingSet.has(key)) {
      console.log(`⏭️  [${i+1}/${items.length}] موجود مسبقاً: ${item.name} - ${item.company}`);
      skipped++;
      continue;
    }

    const payload = {
      name: item.name,
      company: item.company,
      cat: item.cat,
      unit: item.unit,
      stock_qty: 0,
      search_key: `${item.name} ${item.company}`.toLowerCase(),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`✅ [${i+1}/${items.length}] تمت إضافة: ${item.name} - ${item.company} [${item.cat} | ${item.unit}]`);
      added++;
    } else {
      const err = await res.text();
      console.error(`❌ [${i+1}/${items.length}] خطأ: ${item.name} - ${err}`);
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📦 الإجمالي: ${items.length} صنف`);
  console.log(`✅ تمت إضافتهم: ${added}`);
  console.log(`⏭️  موجود مسبقاً: ${skipped}`);
  console.log(`❌ أخطاء: ${errors}`);
  console.log(`${'─'.repeat(50)}\n`);
}

insertItems().catch(console.error);
