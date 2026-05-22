/** Normalize item fields from Firestore (itemName/name, category/cat, unit default كرتونة). */
export const getItemName = (i) => {
   if (!i) return '';
   const name = (i.itemName ?? i.name ?? '').toString();
   return name
     .replace(/\s*[-—]+\s*$/, '') // Clean trailing hyphens/dashes: " -", " --", " - -", " —"
     .replace(/\s*-\s*بدون شركة$/, '')
     .trim();
};
export const getCompany = (i) => i?.company || 'بدون شركة';
export const getCategory = (i) => i?.category ?? i?.cat ?? 'أخرى';
export const getUnit = (i) => i?.unit || 'كرتونة';

export const isInvalidCompany = (c) => {
   if (!c) return true;
   const trimmed = c.trim();
   return trimmed === '' || trimmed === '-' || trimmed === '--' || trimmed === '- -' || trimmed === 'بدون شركة' || trimmed === 'بدون' || trimmed === '—';
};

export const formatItemNameWithCompany = (name, company) => {
    const cleanName = (name ?? '').toString().replace(/\s*[-—]+\s*$/, '').trim();
    if (isInvalidCompany(company)) return cleanName;
    return `${cleanName} - ${company}`;
};

export const formatItemDisplay = (name, company, separator = '—') => {
    const cleanName = (name ?? '').toString().replace(/\s*[-—]+\s*$/, '').trim();
    if (isInvalidCompany(company)) return cleanName;
    return `${cleanName} ${separator} ${company}`;
};
