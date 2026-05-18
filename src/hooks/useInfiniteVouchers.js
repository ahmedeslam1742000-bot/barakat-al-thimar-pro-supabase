import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useInfiniteVouchers({ search = '', type = '', status = '', perPage = 30 } = {}) {
  return useInfiniteQuery({
    queryKey: ['vouchers', search, type, status, perPage],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get('/vouchers', {
        params: {
          page: pageParam,
          per_page: perPage,
          search,
          type,
          status,
        },
      });

      return data;
    },
    getNextPageParam: (lastPage) => (
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined
    ),
    initialPageParam: 1,
  });
}
