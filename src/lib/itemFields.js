/** Normalize item fields from Firestore (itemName/name, category/cat, unit default كرتونة). */
export const getItemName = (i) => {
   const name = (i?.itemName ?? i?.name ?? '').toString();
   // Remove any trailing " - -" or " - بدون شركة" from the name if it got saved that way
   return name.replace(/\s*-\s*-$/, '').replace(/\s*-\s*بدون شركة$/, '').trim();
};
export const getCompany = (i) => i?.company || 'بدون شركة';
export const getCategory = (i) => i?.category ?? i?.cat ?? 'أخرى';
export const getUnit = (i) => i?.unit || 'كرتونة';

export const formatItemNameWithCompany = (name, company) => {
    if (!company || company === '-' || company === 'بدون شركة') return name;
    return `${name} - ${company}`;
};

export const formatItemDisplay = (name, company, separator = '—') => {
    if (!company || company === '-' || company === 'بدون شركة') return name;
    return `${name} ${separator} ${company}`;
};
