import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useInfiniteProducts(filters = {}) {
  const fetchProducts = async ({ pageParam = 1 }) => {
    const { data } = await api.get('/products', {
      params: {
        page: pageParam,
        per_page: 50,
        search: filters.search || '',
        category: filters.category && filters.category !== 'الكل' ? filters.category : '',
      },
    });
    return data;
  };

  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
