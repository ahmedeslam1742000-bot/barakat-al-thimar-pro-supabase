import { useState, useMemo } from 'react';

/**
 * useTransactionAnalytics - Hook for handling chart data processing and filters.
 */
export function useTransactionAnalytics({ dbTransactionsList, items }) {
  const [chartMode, setChartMode] = useState('category'); 
  const [chartItemFilter, setChartItemFilter] = useState('الكل');
  const [chartCompanyFilter, setChartCompanyFilter] = useState('الكل');
  const [chartDateRange, setChartDateRange] = useState('هذا الشهر');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [chartCustomStartDate, setChartCustomStartDate] = useState('');
  const [chartCustomEndDate, setChartCustomEndDate] = useState('');

  const { dynamicSalesData, categorySummary, topSellingItems } = useMemo(() => {
    if (!dbTransactionsList || dbTransactionsList.length === 0) {
      const emptyData = [{ index: 0, name: 'لا توجد بيانات', company: '-', sales: 0, date: '-' }];
      return { dynamicSalesData: emptyData, categorySummary: [], topSellingItems: [] };
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
        category: matchedItem ? (matchedItem.cat || 'غير مصنف') : 'غير مصنف',
        companyName: matchedItem ? (matchedItem.company || 'بدون شركة') : 'بدون شركة',
        rawItemName: matchedItem ? matchedItem.name : tx.item,
        price: matchedItem ? (Number(matchedItem.price) || 0) : 0
      };
    });

    // 3. Filter for Sales (Issue)
    const salesTxs = enrichedTxs.filter(t => 
      t.type === 'Issue' || t.type === 'out' || t.type === 'صادر' || t.type === 'سند إخراج صوري'
    );

    // 4. Group by Category (Summary)
    const catGroups = salesTxs.reduce((acc, tx) => {
      const cat = tx.category;
      if (!acc[cat]) acc[cat] = { name: cat, sales: 0, itemsCount: new Set(), totalValue: 0 };
      acc[cat].sales += Number(tx.qty || 0);
      acc[cat].itemsCount.add(tx.rawItemName);
      acc[cat].totalValue += (Number(tx.qty || 0) * tx.price);
      return acc;
    }, {});

    const categorySummary = Object.values(catGroups).sort((a, b) => b.sales - a.sales);

    // 5. Apply Sidebar Category and Company Filters for Dynamic Data
    const finalizedTxs = salesTxs.filter(tx => {
      if (selectedCategory !== 'الكل' && tx.category !== selectedCategory) return false;
      if (chartCompanyFilter !== 'الكل' && tx.companyName !== chartCompanyFilter) return false;
      if (chartMode === 'item' && chartItemFilter !== 'الكل' && tx.rawItemName !== chartItemFilter) return false;
      return true;
    });

    // 6. Calculate Top Selling Items for the selected scope
    const itemMap = finalizedTxs.reduce((acc, tx) => {
      const name = tx.rawItemName;
      if (!acc[name]) acc[name] = { name, sales: 0, company: tx.companyName, category: tx.category };
      acc[name].sales += Number(tx.qty || 0);
      return acc;
    }, {});

    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);

    // 7. Prepare Time-series Chart Data
    const chartTransactions = [...finalizedTxs].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp) : new Date();
      const dateB = b.timestamp ? new Date(b.timestamp) : new Date();
      return dateA - dateB;
    });

    let dynamicSalesData = chartTransactions.map((tx, index) => ({
      index,
      name: tx.rawItemName,
      company: tx.companyName,
      sales: Number(tx.qty),
      date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('ar-SA') : '-',
      category: tx.category
    }));

    if (dynamicSalesData.length === 0) {
      dynamicSalesData = [{ index: 0, name: 'لا توجد بيانات', company: '-', sales: 0, date: '-' }];
    }
    
    return { dynamicSalesData, categorySummary, topSellingItems };
  }, [dbTransactionsList, items, chartDateRange, chartCustomStartDate, chartCustomEndDate, chartCompanyFilter, chartMode, chartItemFilter, selectedCategory]);

  return {
    chartMode, setChartMode,
    chartItemFilter, setChartItemFilter,
    chartCompanyFilter, setChartCompanyFilter,
    chartDateRange, setChartDateRange,
    selectedCategory, setSelectedCategory,
    chartCustomStartDate, setChartCustomStartDate,
    chartCustomEndDate, setChartCustomEndDate,
    dynamicSalesData,
    categorySummary,
    topSellingItems
  };
}
