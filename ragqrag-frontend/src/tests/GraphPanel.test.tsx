import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GraphPanel from '../components/graph/GraphPanel';

describe('GraphPanel', () => {
  it('renders header and container', () => {
    render(
      <GraphPanel
        nodes={[]}
        edges={[]}
        onSelectDocument={() => {
          // noop
        }}
      />,
    );
    expect(screen.getByText(/knowledge graph/i)).toBeInTheDocument();
  });
});


