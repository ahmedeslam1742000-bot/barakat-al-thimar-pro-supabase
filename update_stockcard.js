const fs = require('fs');
let content = fs.readFileSync('src/pages/StockCard.jsx', 'utf8');

content = content.replace(
  /import \{ supabase \} from '\.\.\/lib\/supabaseClient';/,
  `import { supabase } from '../lib/supabaseClient';\nimport { useData } from '../contexts/DataContext';`
);

content = content.replace(
  /  const \[loading, setLoading\] = useState\(true\);\n  const \[items, setItems\] = useState\(\[\]\);/,
  `  const { items, isLoading: loading } = useData();`
);

content = content.replace(
  /  const fetchItems = useCallback\(async \(\) => \{\n    setLoading\(true\);\n    try \{\n      const \{ data, error \} = await supabase\n        \.from\('products'\)\n        \.select\('\*'\)\n        \.order\('name', \{ ascending: true \}\);\n\n      if \(error\) throw error;\n      setItems\(data \|\| \[\]\);\n    \} catch \(err\) \{\n      console\.error\('Error fetching items:', err\);\n      toast\.error\('حدث خطأ أثناء تحميل الأصناف'\);\n    \} finally \{\n      setLoading\(false\);\n    \}\n  \}, \[\]\);\n\n  useEffect\(\(\) => \{\n    void fetchItems\(\);\n  \}, \[fetchItems\]\);\n\n  \/\/ ── Realtime: تحديث تلقائي عند تغيير بيانات المنتجات ──────────────────\n  useEffect\(\(\) => \{\n    const channel = supabase\.channel\('stock-card-live'\)\n      \.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'products' \}, \(\) => \{ void fetchItems\(\); \}\)\n      \.subscribe\(\);\n    return \(\) => \{ supabase\.removeChannel\(channel\); \};\n  \}, \[fetchItems\]\);/,
  ``
);

content = content.replace(
  /      \}\)\n      \.subscribe\(\);\n\n    return \(\) => \{ supabase\.removeChannel\(channel\); \};\n  \}, \[isModalOpen, selectedItem, fetchItemHistory, fetchItems\]\);/g,
  `      })\n      .subscribe();\n\n    return () => { supabase.removeChannel(channel); };\n  }, [isModalOpen, selectedItem, fetchItemHistory]);`
);

// We need to also remove `fetchItems` from inside fetchItemHistory live update:
content = content.replace(
  /\/\/ تحديث معلومات الصنف في الواجهة \(الرصيد الحالي\)\n        void fetchItems\(\);/g,
  `// DataContext updates items globally`
);

fs.writeFileSync('src/pages/StockCard.jsx', content);
