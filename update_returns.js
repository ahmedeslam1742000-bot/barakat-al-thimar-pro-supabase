const fs = require('fs');
let content = fs.readFileSync('src/pages/Returns.jsx', 'utf8');

// Replace returnTxs
content = content.replace(
  /const returnTxs = useMemo\(\(\) => transactions\.filter\(\(t\) => t\.type === 'return'\), \[transactions\]\);/g,
  `const returnTxs = useMemo(() => transactions.filter((t) => t.type === 'return'), [transactions]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedSearchNameText = useDebounce(searchNameText, 300);`
);

// Replace search usages
content = content.replace(
  /const q = normalizeArabic\(searchNameText\);/g,
  'const q = normalizeArabic(debouncedSearchNameText);'
);

content = content.replace(
  /\[items, searchNameText, selectedItem\]\);/g,
  '[items, debouncedSearchNameText, selectedItem]);'
);

// Replace filtered items search
content = content.replace(
  /sk\.includes\(normalizeArabic\(searchQuery\)\)/g,
  '(debouncedSearchQuery === "" || sk.includes(normalizeArabic(debouncedSearchQuery)))'
);

content = content.replace(
  /\[returnTxs, items, searchQuery, categoryFilter, companyFilter, showHotOnly, hotMap\]/g,
  '[returnTxs, items, debouncedSearchQuery, categoryFilter, companyFilter, showHotOnly, hotMap]'
);

// Replace groupedVouchers search
content = content.replace(
  /const q = normalizeArabic\(searchQuery\);/g,
  'const q = normalizeArabic(debouncedSearchQuery);'
);

content = content.replace(
  /\[returnTxs, searchQuery, startDate, endDate\]/g,
  '[returnTxs, debouncedSearchQuery, startDate, endDate]'
);

fs.writeFileSync('src/pages/Returns.jsx', content);
