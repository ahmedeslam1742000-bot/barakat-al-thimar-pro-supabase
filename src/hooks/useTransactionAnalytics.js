import { useState, useMemo } from 'react';

/**
 * useTransactionAnalytics - Hook for handling chart data processing and filters.
 */
export function useTransactionAnalytics({ dbTransactionsList, items }) {
  const [chartMode, setChartMode] = useState('category'); // 'category' | 'item'
  const [chartItemFilter, setChartItemFilter] = useState('الكل');
  const [chartItemSearchQuery, setChartItemSearchQuery] = useState('');
  const [isChartItemSearchOpen, setIsChartItemSearchOpen] = useState(false);
  const [chartCompanyFilter, setChartCompanyFilter] = useState('الكل');
  const [chartDateRange, setChartDateRange] = useState('هذا الشهر');
  const [chartCustomStartDate, setChartCustomStartDate] = useState('');
  const [chartCustomEndDate, setChartCustomEndDate] = useState('');

  const dynamicSalesData = useMemo(() => {
    if (!dbTransactionsList || dbTransactionsList.length === 0) {
      return [{ index: 0, name: 'لا توجد بيانات', company: '-', sales: 0, date: '-' }];
    }

    const now = new Date();
    
    // 1. Filter by Date Range
    const filteredTxForChart = dbTransactionsList.filter(tx => {
      if (chartDateRange === 'الكل') return true;
      if (!tx.timestamp) return true;
      const txDate = new Date(tx.timestamp);
      
      if (chartDateRange === 'آخر 7 أيام') {
        const diffTime = Math.abs(now - txDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
      }
      if (chartDateRange === 'هذا الشهر') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (chartDateRange === 'هذا العام') {
        return txDate.getFullYear() === now.getFullYear();
      }
      if (chartDateRange === 'مخصص') {
        if (!chartCustomStartDate || !chartCustomEndDate) return true;
        const end = new Date(chartCustomEndDate);
        end.setHours(23, 59, 59, 999);
        return txDate >= new Date(chartCustomStartDate) && txDate <= end;
      }
      return true;
    });

    // 2. Enrich with Item metadata
    const enrichedTxs = filteredTxForChart.map(tx => {
      const txItemStr = tx.item || 'غير معروف';
      const matchedItem = items.find(i => 
        i.id === tx.itemId || 
        (txItemStr.includes(i.name) && (i.company === 'بدون شركة' || txItemStr.includes(i.company)))
      );
      return {
        ...tx,
        category: matchedItem ? matchedItem.cat : 'أخرى',
        companyName: matchedItem ? (matchedItem.company || 'بدون شركة') : 'بدون شركة',
        rawItemName: matchedItem ? matchedItem.name : tx.item
      };
    });

    // 3. Apply Company and Item Filters
    const finalizedTxs = enrichedTxs.filter(tx => {
      if (chartCompanyFilter !== 'الكل' && tx.companyName !== chartCompanyFilter) return false;
      if (chartMode === 'item' && chartItemFilter !== 'الكل' && tx.rawItemName !== chartItemFilter) return false;
      return true;
    });

    // 4. Filter for Sales (Issue) and Sort
    const chartTransactions = finalizedTxs
      .filter(t => t.type === 'Issue' || t.type === 'out' || t.type === 'صادر' || t.type === 'سند إخراج صوري')
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date();
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date();
        return dateA - dateB;
      });

    // 5. Map to Chart Data
    let data = chartTransactions.map((tx, index) => ({
      index,
      name: tx.rawItemName,
      company: tx.companyName,
      sales: Number(tx.qty),
      date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('ar-SA') : '-',
      category: tx.category
    }));

    if (data.length === 0) {
      return [{ index: 0, name: 'لا توجد بيانات', company: '-', sales: 0, date: '-' }];
    }
    
    return data;
  }, [dbTransactionsList, items, chartDateRange, chartCustomStartDate, chartCustomEndDate, chartCompanyFilter, chartMode, chartItemFilter]);

  return {
    chartMode, setChartMode,
    chartItemFilter, setChartItemFilter,
    chartItemSearchQuery, setChartItemSearchQuery,
    isChartItemSearchOpen, setIsChartItemSearchOpen,
    chartCompanyFilter, setChartCompanyFilter,
    chartDateRange, setChartDateRange,
    chartCustomStartDate, setChartCustomStartDate,
    chartCustomEndDate, setChartCustomEndDate,
    dynamicSalesData
  };
}
