// ===================================================
// سكريبت إضافة مجموعة إضافية من الأصناف
// يُشغَّل مرة واحدة: node add_extra_items.mjs
// ===================================================

const SUPABASE_URL = "https://byrdvzxkotgkznbtkueu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmR2enhrb3Rna3puYnRrdWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MzY1NSwiZXhwIjoyMDkxODQ5NjU1fQ.Rg5Cz7rTe0AEqcFEq9OEw3I_AnyhIxlSvjfDJxW_iVU";

const extraItems = [
  { name: "فانيلا ريحان", company: "-", cat: "تبريد", unit: "كرتونة" },
  { name: "مانجو شرائح", company: "سفرة", cat: "مجمدات", unit: "كرتونة" },
  { name: "فراوله", company: "بست", cat: "مجمدات", unit: "كرتونة" },
  { name: "فراوله", company: "هابي فارم", cat: "مجمدات", unit: "كرتونة" },
  { name: "رمان", company: "سوري", cat: "مجمدات", unit: "كرتونة" },
  { name: "رمان", company: "روفي", cat: "مجمدات", unit: "كرتونة" },
  { name: "كريمة", company: "هوبلا", cat: "تبريد", unit: "شدة" },
  { name: "افوكادو مطحون", company: "روفي", cat: "مجمدات", unit: "كرتونة" },
  { name: "فراوله", company: "روفي", cat: "مجمدات", unit: "كرتونة" },
  { name: "لون مانجا", company: "-", cat: "تبريد", unit: "حبة" },
  { name: "لون فراوله", company: "-", cat: "تبريد", unit: "حبة" },
  { name: "كاسات ماء ابيض", company: "-", cat: "بلاستيك", unit: "كرتونة" },
  { name: "كاسات ماء شفاف", company: "-", cat: "بلاستيك", unit: "كرتونة" },
];

async function addExtraItems() {
  console.log(`\n🚀 إضافة ${extraItems.length} صنف إضافي...\n`);

  for (let i = 0; i < extraItems.length; i++) {
    const item = extraItems[i];
    
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
      console.log(`✅ [${i+1}/${extraItems.length}] تمت الإضافة: ${item.name} - ${item.company}`);
    } else {
      const err = await res.text();
      console.error(`❌ [${i+1}/${extraItems.length}] خطأ: ${item.name} - ${err}`);
    }
  }
  console.log(`\n✨ تم الانتهاء!`);
}

addExtraItems().catch(console.error);
