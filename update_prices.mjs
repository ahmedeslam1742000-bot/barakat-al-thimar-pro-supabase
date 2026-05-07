// ===================================================
// سكريبت تحديث الأسعار - بركة الثمار
// يُشغَّل مرة واحدة: node update_prices.mjs
// ===================================================

const SUPABASE_URL = "https://byrdvzxkotgkznbtkueu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmR2enhrb3Rna3puYnRrdWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MzY1NSwiZXhwIjoyMDkxODQ5NjU1fQ.Rg5Cz7rTe0AEqcFEq9OEw3I_AnyhIxlSvjfDJxW_iVU";

const priceUpdates = [
  // ── مجمدات ──
  { name: "فراوله", company: "ماريتا", price: 52.00 },
  { name: "رمان", company: "داري", price: 85.00 },
  { name: "مانجو شرائح", company: "روفي", price: 75.00 },
  { name: "فراوله 10كجم", company: "كيت", price: 45.00 },
  { name: "فراوله", company: "بركة", price: 40.00 },
  { name: "جوافة حب 10 كجم", company: "روفي", price: 50.00 },
  { name: "مانجو حب مجمد 10 كجم", company: "روفي", price: 75.00 },
  { name: "مانجو مطحون", company: "مونتانا", price: 120.00 },
  { name: "مانجو مطحون", company: "بريمير", price: 100.00 },
  { name: "جوافة مطحون", company: "بريمير", price: 80.00 },
  { name: "جوافة مطحون", company: "مونتانا", price: 95.00 },

  // ── بلاستيك ──
  { name: "مناديل ماكس رول 300 متر شد 6", company: "فاين", price: 50.00 },
  { name: "حامل اكواب ثنائى شد 225", company: "فاين", price: 40.00 },
  { name: "حامل اكواب رباعى شد 225", company: "فاين", price: 75.00 },
  { name: "رول تغليف اكواب عصير مطبوع 3000 كوب", company: "فاين", price: 55.00 },
  { name: "مناديل مربعة 30*30 شد 40", company: "فاين", price: 65.00 },
  { name: "علب سلطة كريستال دائرى 12 اونص شد 300", company: "فاين", price: 85.00 },
  { name: "علب سلطة كريستال دائرى 16 اونص شد 300", company: "فاين", price: 100.00 },
  { name: "علب سلطة كريستال دائرى 24 اونص شد 300", company: "فاين", price: 110.00 },
  { name: "علب سلطة كريستال مربع 12 اونص شد 240 A", company: "فاين", price: 75.00 },
  { name: "علب سلطة كريستال مربع 12 اونص شد 240 B", company: "فاين", price: 78.00 },
  { name: "علب سلطة كريستال مربع 16 اونص شد 240", company: "فاين", price: 85.00 },
  { name: "علب سلطة كريستال مربع 24 اونص شد 240", company: "فاين", price: 100.00 },
  { name: "جالون شفاف مستطيل 1 لتر مع الغطاء", company: "عسق", price: 65.00 },
  { name: "جالون شفاف مستطيل 1.5 لتر مع الغطاء", company: "عسق", price: 84.60 },
  { name: "جالون شفاف مستطيل 1 لتر بدون غطاء", company: "تغليف", price: 65.00 },
  { name: "جالون شفاف مستطيل 1.5 لتر بدون غطاء", company: "تغليف", price: 45.00 },
  { name: "جركين جالون ابيض 1 لتر شد 24", company: "عسق", price: 20.00 },
  { name: "جركين جالون ابيض 1.5 لتر شد 24", company: "عسق", price: 20.00 },
  { name: "جركين جالون ابيض 2 لتر شد 18", company: "عسق", price: 25.00 },
  { name: "جركين جالون عصير 3 لتر شد 12", company: "عسق", price: 30.00 },
  { name: "جركين جالون عصير 5 لتر شد 12", company: "عسق", price: 38.00 },
  { name: "جركين جالون عصير 10 لتر شد 12", company: "عسق", price: 40.00 },
  { name: "غرشات مستطيل 100 مل مع الغطاء", company: "عسق", price: 200.00 },
  { name: "غرشات 150 مل مستطيل مع الغطاء", company: "عسق", price: 220.00 },
  { name: "غرشات مستطيل 200 مل مع الغطاء", company: "عسق", price: 95.00 },
  { name: "غرشات مستطيل 250 مل مع الغطاء", company: "عسق", price: 105.00 },
  { name: "غرشات مستطيل 330 مل مع الغطاء", company: "عسق", price: 105.00 },
  { name: "غرشات 500 مل مع الغطاء", company: "عسق", price: 170.00 },
  { name: "مصاص اسود 10مل طويل شد 2000", company: "فاين", price: 110.00 },
  { name: "مصاص اسود 8 مل شد 4000", company: "فاين", price: 100.00 },
  { name: "مصاص اسود 10 مل شد 4000", company: "فاين", price: 110.00 },
  { name: "مصاص ملون 6 مل شد 5000", company: "فاين", price: 100.00 },
  { name: "مصاص ملون 8 مل شد 4000", company: "فاين", price: 100.00 },
  { name: "مصاص ملون 10 مل شد 4000", company: "فاين", price: 110.00 },
  { name: "كاسات 10 شد 1000 s", company: "امداد", price: 115.00 },
  { name: "كاسات 12 شد 1000 s", company: "امداد", price: 120.00 },
  { name: "كاسات 16 شد 1000 s", company: "امداد", price: 130.00 },
  { name: "كاسات 20 شد 1000 s", company: "امداد", price: 170.00 },
  { name: "كاسات صينى 12 اونص شد 1000", company: "فاين", price: 120.00 },
  { name: "كاسات صينى 16 اونص شد 1000", company: "فاين", price: 130.00 },
  { name: "كاسات اماراتي 12 اونص شد 1000", company: "كابكو", price: 115.00 },
  { name: "كاسات اماراتي 16 اونص شد 1000", company: "كابكو", price: 130.00 },
  { name: "كاسات 10 اونص غطاء قبة", company: "ابيكو", price: 120.00 },
  { name: "كاسات 12 اونص شد 1000 قبة", company: "ابيكو", price: 150.00 },
  { name: "كاسات 16 اونص غطاء قبة", company: "ابيكو", price: 160.00 },
  { name: "كاسات 10 اونص مع الغطاء شد 1000", company: "جاسكو", price: 135.00 },
  { name: "كاسات 12 اونص مع الغطاء شد 1000", company: "جاسكو", price: 165.00 },
  { name: "كاسات 16 اونص مع الغطاء شد 1000", company: "جاسكو", price: 200.00 },
  { name: "اطباق سوشى 002 شد 460", company: "فاين", price: 180.00 },
  { name: "اطباق سوشى 007 شد 320", company: "فاين", price: 180.00 },
  { name: "اطباق سوشى 009 شد 264", company: "فاين", price: 180.00 },
  { name: "اطباق سوشى 1100 شد 800", company: "فاين", price: 180.00 },
  { name: "اطباق سوشى 1103 شد 400", company: "فاين", price: 180.00 },
  { name: "اطباق سوشى 05 شد 400", company: "فاين", price: 180.00 },
  { name: "ملاعق ايس كريم اسود شد 1000", company: "فاين", price: 35.00 },
  { name: "ملاعق ايس كريم ملون شد 1000", company: "فاين", price: 35.00 },
  { name: "ملاعق ايس كريم شفاف شد 1000", company: "فاين", price: 35.00 },
  { name: "شوك حلا ملون شد 2000", company: "فاين", price: 45.00 },
  { name: "ملاعق ايس كريم ملون vip شد 1000", company: "فاين", price: 45.00 },
  { name: "شوكة طعام اسود شد 1000", company: "فاين", price: 35.00 },
  { name: "ملاعق طعام اسود شد 1000", company: "فاين", price: 35.00 },
  { name: "ملاعق طعام HD اسود شد 1000", company: "فاين", price: 70.00 },
  { name: "شوكة طعام HD اسود شد 1000", company: "فاين", price: 70.00 },
  { name: "ملاعق مغلفة شد 1000", company: "فاين", price: 100.00 },
  { name: "شوكة مغلفة شد 1000", company: "فاين", price: 100.00 },
  { name: "سكين مغلف شد 1000", company: "فاين", price: 100.00 },
  { name: "مجموعة طعام ملعقة وشوكة وسكينة ومنديل شد 500 A", company: "فاين", price: 120.00 },
  { name: "مجموعة طعام ملعقة وشوكة وسكينة ومنديل شد 500 B", company: "فاين", price: 120.00 },
  { name: "مجموعة طعام شوكة وسكين ومنديل شد 500", company: "فاين", price: 120.00 },
  { name: "قفاز اسود لارج شد 700", company: "فاين", price: 70.00 },
  { name: "قفاز شفاف لارج شد 700", company: "فاين", price: 65.00 },
  { name: "غطاء رأس أزرق شد 1000", company: "فاين", price: 55.00 },
  { name: "غطاء رأس أسود شد 1000", company: "فاين", price: 55.00 },
  { name: "مريول مطبخ شد 1000", company: "فاين", price: 55.00 },
  { name: "اكياس بلدية 70 جالون 10كجم", company: "فاين", price: 50.00 },
  { name: "اكياس بلدية 55 جالون 10 كجم", company: "فاين", price: 50.00 },
  { name: "اكياس نفايات 90 جالون 10 كجم", company: "فاين", price: 50.00 },
  { name: "بكرة فوط non-woven زرقاء 475 قطعة", company: "فاين", price: 140.00 },
  { name: "غطاء كاسات صينى شد 1000", company: "MM", price: 55.00 },
  { name: "صحون مايكروويف غير مقسم C1 شد 250", company: "فاين", price: 85.00 },
  { name: "صحون مايكروويف مقسم 2 شد 250", company: "فاين", price: 80.00 },
  { name: "كاسات ماء ابيض شد 1000", company: "فاين", price: 18.00 },
  { name: "كاسات ماء شفافه شد 1000", company: "فاين", price: 19.00 },
  { name: "كاسات تذوق ورقية 2.5 اونص", company: "فاين", price: 30.00 },

  // ── تبريد ──
  { name: "نكهة موهيتو 5 لتر", company: "الفي", price: 190.00 },
  { name: "نكهة فراولة 750 مل", company: "الفي", price: 36.00 },
  { name: "سكر سعودي ناعم 50 كجم", company: "-", price: 125.00 },
  { name: "حليب طويل الاجل شد 12", company: "-", price: 48.00 },
  { name: "مزيج ايس كريم فانيليا شد 12", company: "الري", price: 108.00 },
  { name: "مزيج ايس كريم فراوله شد 12", company: "الري", price: 108.00 },
  { name: "مزيج ايس كريم مانجو شد 12", company: "الري", price: 108.00 },
  { name: "مزيج ايس كريم شوكولاته شد 12", company: "الري", price: 108.00 },
  { name: "مزيج ايس كريم فستق شد 12", company: "الري", price: 108.00 },
  { name: "حشوة شوكولاتة نوتيلا 5 كجم", company: "ستار دوبلن", price: 65.00 },
  { name: "حشوة فستق حلبى 17% 5 كجم", company: "لوفا", price: 130.00 },
  { name: "لوتس 5 كجم", company: "ارما", price: 100.00 },
  { name: "حشوة شوكولاتة بيضاء 5 كجم", company: "لوفا", price: 105.00 },
  { name: "حشوة شوكولاته بوينو كندر 5 كجم", company: "لوفا", price: 125.00 },

  // ── آخر مجموعات بلاستيك ──
  { name: "كاسات دائرية غطاء اسود 360 مل شد 500", company: "فاين", price: 150.00 },
  { name: "كاسات دائرية غطاء اسود 500 مل شد 500", company: "فاين", price: 160.00 },
  { name: "كاسات دائرية غطاء اسود 700 مل شد 500", company: "فاين", price: 200.00 },
  { name: "صندوق فلين ابيض دائرى كبير شد 8", company: "-", price: 95.00 },
  { name: "صندوق فلين دائرى ابيض وسط شد 10", company: "-", price: 100.00 },
];

async function updatePrices() {
  console.log(`\n💰 بدء تحديث الأسعار لـ ${priceUpdates.length} صنف...\n`);

  // Fetch all products first to get their IDs
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,company`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  const products = await res.json();
  const productMap = new Map();
  products.forEach(p => productMap.set(`${p.name}||${p.company}`, p.id));

  let updated = 0, notFound = 0, errors = 0;

  for (let i = 0; i < priceUpdates.length; i++) {
    const update = priceUpdates[i];
    const key = `${update.name}||${update.company}`;
    const productId = productMap.get(key);

    if (!productId) {
      console.warn(`⚠️ [${i+1}/${priceUpdates.length}] لم يتم العثور على الصنف: ${update.name} - ${update.company}`);
      notFound++;
      continue;
    }

    const resUpdate = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ 
        price: update.price,
        old_price: 0 // Starting with 0 as old price for new items
      }),
    });

    if (resUpdate.ok) {
      console.log(`✅ [${i+1}/${priceUpdates.length}] تم تحديث السعر: ${update.name} -> ${update.price}`);
      updated++;
    } else {
      const err = await resUpdate.text();
      console.error(`❌ [${i+1}/${priceUpdates.length}] خطأ أثناء تحديث ${update.name}: ${err}`);
      errors++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 ملخص التحديث:`);
  console.log(`✅ تم التحديث: ${updated}`);
  console.log(`⚠️ لم يتم العثور: ${notFound}`);
  console.log(`❌ أخطاء: ${errors}`);
  console.log(`${'─'.repeat(50)}\n`);
}

updatePrices().catch(console.error);
