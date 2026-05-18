import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useVoucherMutations() {
  const queryClient = useQueryClient();

  const createVoucher = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/vouchers', payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries or let Reverb handle updates automatically via Echo
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const updateVoucher = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/vouchers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const deleteVoucher = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const updateVoucherStatus = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/vouchers/${id}/status`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  return {
    createVoucher,
    updateVoucher,
    deleteVoucher,
    updateVoucherStatus,
  };
}
