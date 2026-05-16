import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type DatabaseStatsResponse = {
  total_documents: number;
  collection_name?: string;
  last_updated?: string;
};

const getDatabaseStats = async (): Promise<DatabaseStatsResponse> => {
  const response = await apiClient.get('/database/stats');
  return response.data;
};

export const useDatabaseStats = () => {
  return useQuery({
    queryKey: ['database-stats'],
    queryFn: getDatabaseStats,
    refetchInterval: 30000, // Refetch every 30 seconds to keep stats updated
    retry: 3,
    retryDelay: 1000,
  });
};
