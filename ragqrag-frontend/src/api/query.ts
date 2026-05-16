import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export type RetrievedDoc = {
  id: string;
  score: string;
  title: string;
  summary: string;
  keywords: string;
  url: string;
};

export type GraphNode = {
  id: string;
  label: string;
  group: string;
  score?: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  relation?: string;
};

export type QueryResponse = {
  retrieved_docs: RetrievedDoc[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  session_id: string;
  answer: string;
};

export type QueryPayload = {
  query: string;
  k: number;
};

export const queryKeys = {
  query: ['query'] as const,
};

export const useQueryApi = () => {
  return useMutation<QueryResponse, Error, QueryPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<QueryResponse>('/query', payload);
      return data;
    },
  });
};


