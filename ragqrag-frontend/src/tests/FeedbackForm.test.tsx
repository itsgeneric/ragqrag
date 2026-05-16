import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackForm from '../components/feedback/FeedbackForm';

describe('FeedbackForm', () => {
  it('validates ratings and calls onSubmit with correct payload', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<FeedbackForm onSubmit={handleSubmit} />);

    const button = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(button);

    expect(handleSubmit).toHaveBeenCalled();
    const payload = handleSubmit.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toHaveProperty('model_type');
    expect(payload[0]).toHaveProperty('ratings');
  });
});


