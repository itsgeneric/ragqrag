import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export type Metrics = {
  bleu: number;
  rouge_l: number;
};

export type ComparisonMetrics = {
  plain_llm: Metrics;
  mongodb_rag: Metrics;
  neo4j_kg_rag: Metrics;
};

export type ComparisonResponse = {
  plain_llm_answer: string;
  mongodb_rag_answer: string;
  neo4j_kg_rag_answer: string;
  calculated_metrics: ComparisonMetrics;
};

export const useGenerateComparison = () => {
  return useMutation<ComparisonResponse, Error, { session_id: string }>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ComparisonResponse>('/generate_comparison', payload);
      return data;
    },
  });
};


