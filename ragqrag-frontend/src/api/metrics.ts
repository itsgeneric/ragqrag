import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export type MetricsEntry = {
  session_id: string;
  query: string;
  model_type: string;
  human_ratings?: {
    factual_accuracy?: number;
    completeness?: number;
    coherence?: number;
    helpfulness?: number;
  };
  calculated_metrics?: Record<
    string,
    {
      bleu: number;
      rouge_l: number;
    }
  >;
};

export type MetricsResponse = {
  metrics: MetricsEntry[];
  total_entries: number;
};

export const metricsKeys = {
  all: ['metrics'] as const,
};

export const useMetrics = () => {
  return useQuery({
    queryKey: metricsKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<MetricsResponse>('/save-metrics');
      return data;
    },
  });
};


