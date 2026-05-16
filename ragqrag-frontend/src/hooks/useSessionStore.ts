import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RetrievedDoc, GraphNode, GraphEdge } from '../api/query';
import type { ComparisonResponse } from '../api/comparison';

type SessionState = {
  sessionId: string | null;
  lastQuery: string;
  reduceMotion: boolean;
  lastDocs: RetrievedDoc[];
  lastNodes: GraphNode[];
  lastEdges: GraphEdge[];
  lastAnswer: string;
  lastComparison: ComparisonResponse | null;
  setSession: (sessionId: string | null, lastQuery?: string) => void;
  setLastResult: (docs: RetrievedDoc[], nodes: GraphNode[], edges: GraphEdge[], answer: string) => void;
  setLastComparison: (comparison: ComparisonResponse | null) => void;
  setReduceMotion: (value: boolean) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      lastQuery: '',
      reduceMotion: false,
      lastDocs: [],
      lastNodes: [],
      lastEdges: [],
      lastAnswer: '',
      lastComparison: null,
      setSession: (sessionId, lastQuery = '') =>
        set({
          sessionId,
          lastQuery,
        }),
      setLastResult: (docs, nodes, edges, answer) =>
        set({
          lastDocs: docs,
          lastNodes: nodes,
          lastEdges: edges,
          lastAnswer: answer,
        }),
      setLastComparison: (comparison) =>
        set({
          lastComparison: comparison,
        }),
      setReduceMotion: (value) =>
        set({
          reduceMotion: value,
        }),
    }),
    {
      name: 'rag-kg-session', // key in sessionStorage
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const value = window.sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          window.sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          window.sessionStorage.removeItem(name);
        },
      },
    },
  ),
);

