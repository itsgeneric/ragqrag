import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export const useCleanupSession = () => {
  return useMutation<{ message: string }, Error, { session_id: string }>({
    mutationFn: async ({ session_id }) => {
      const { data } = await apiClient.delete<{ message: string }>(`/cleanup/${session_id}`);
      return data;
    },
  });
};


