// ===================================================
// سكريبت تصحيح اسم الشركة "فاين"
// يُشغَّل مرة واحدة: node fix_fine_company.mjs
// ===================================================

const SUPABASE_URL = "https://byrdvzxkotgkznbtkueu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmR2enhrb3Rna3puYnRrdWV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI3MzY1NSwiZXhwIjoyMDkxODQ5NjU1fQ.Rg5Cz7rTe0AEqcFEq9OEw3I_AnyhIxlSvjfDJxW_iVU";

async function fixCompanyNames() {
  console.log(`\n🔍 جاري البحث عن الأصناف المسجلة باسم شركة "فاين"...\n`);

  // 1. Fetch all items where company is 'فاين'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?company=eq.فاين&select=id,name`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  
  if (!res.ok) {
    console.error("❌ فشل في جلب البيانات:", await res.text());
    return;
  }

  const products = await res.json();
  console.log(`تم العثور على ${products.length} صنف مسجل باسم فاين.`);

  let updatedCount = 0;
  let skippedCount = 0;

  // 2. Iterate and update
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // إبقاء الصنف المستثنى
    if (product.name.includes("مناديل ماكس رول")) {
      console.log(`⏭️ تم استثناء: ${product.name}`);
      skippedCount++;
      continue;
    }

    const newSearchKey = `${product.name} -`.toLowerCase();

    // 3. Update the database
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ 
        company: "-",
        search_key: newSearchKey
      }),
    });

    if (updateRes.ok) {
      console.log(`✅ تم تصحيح: ${product.name}`);
      updatedCount++;
    } else {
      console.error(`❌ خطأ في تصحيح: ${product.name}`, await updateRes.text());
    }
  }

  console.log(`\n──────────────────────────────────────────────────`);
  console.log(`📊 ملخص التحديث:`);
  console.log(`✅ تم التعديل إلى (-): ${updatedCount}`);
  console.log(`⏭️ تم الاستثناء (بقي فاين): ${skippedCount}`);
  console.log(`──────────────────────────────────────────────────\n`);
}

fixCompanyNames().catch(console.error);
