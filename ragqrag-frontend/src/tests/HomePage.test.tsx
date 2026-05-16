import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '../pages/HomePage';

const renderWithClient = (ui: React.ReactElement) => {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

vi.mock('../api/query', async () => {
  const actual = await vi.importActual<typeof import('../api/query')>('../api/query');
  return {
    ...actual,
    useQueryApi: () => ({
      mutateAsync: vi.fn().mockResolvedValue({
        retrieved_docs: [],
        nodes: [],
        edges: [],
        session_id: 'test-session',
        answer: 'Test answer',
      }),
      isPending: false,
      data: undefined,
      error: null,
    }),
  };
});

describe('HomePage', () => {
  it('submits query and shows answer panel placeholder', async () => {
    renderWithClient(<HomePage />);
    const input = screen.getByPlaceholderText(/ask about your corpus/i);
    fireEvent.change(input, { target: { value: 'What is RAG?' } });
    const button = screen.getByRole('button', { name: /search/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText(/mongoDB RAG answer/i)).toBeInTheDocument();
    });
  });
});


