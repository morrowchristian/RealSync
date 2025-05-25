import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../../components/ui/ErrorBoundary';
import React from 'react';

describe('ErrorBoundary', () => {
  it('renders fallback UI on error', () => {
    const ProblemChild = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('resets state on Try Again button', () => {
    const ProblemChild = () => {
      throw new Error('Test error');
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    screen.getByRole('button', { name: /try again/i }).click();
    rerender(
      <ErrorBoundary>
        <div>Child works!</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child works!')).toBeInTheDocument();
  });
});