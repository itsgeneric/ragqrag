import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

export type ModelType = 'plain_llm' | 'mongodb_rag' | 'neo4j_kg_rag';

export type FeedbackRatings = {
  accuracy: number;
  completeness: number;
  coherence: number;
  helpfulness: number;
};

export type SingleFeedback = {
  model_type: ModelType;
  ratings: FeedbackRatings;
};

export type FeedbackRequest = {
  session_id: string;
  feedbacks: SingleFeedback[];
};

export type FeedbackResponse = {
  success: boolean;
  message: string;
};

export const useSubmitFeedback = () => {
  return useMutation<FeedbackResponse, Error, FeedbackRequest>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<FeedbackResponse>('/human_feedback', payload);
      return data;
    },
  });
};


