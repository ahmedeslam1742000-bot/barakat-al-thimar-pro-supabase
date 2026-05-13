const fs = require('fs');
let content = fs.readFileSync('src/pages/StockCard.jsx', 'utf8');

if (!content.includes('useDebounce')) {
  content = content.replace(
    /import \{ normalizeArabic \} from '\.\.\/lib\/arabicTextUtils';/,
    "import { normalizeArabic } from '../lib/arabicTextUtils';\nimport { useDebounce } from '../hooks/useDebounce';"
  );
}

content = content.replace(
  /const filteredItems = useMemo\(\(\) => \{\n    return items\.filter\(it => \{\n      const q = normalizeArabic\(searchQuery\);/,
  "const debouncedSearchQuery = useDebounce(searchQuery, 300);\n\n  const filteredItems = useMemo(() => {\n    return items.filter(it => {\n      const q = normalizeArabic(debouncedSearchQuery);"
);

content = content.replace(
  /\}, \[items, searchQuery, categoryFilter\]\);/,
  "}, [items, debouncedSearchQuery, categoryFilter]);"
);

fs.writeFileSync('src/pages/StockCard.jsx', content);
