import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, Button, Spinner } from './ui';

describe('ui primitives', () => {
  it('Button defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button');
  });

  it('Spinner exposes a polite status role for screen readers', () => {
    render(<Spinner label="Fetching" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Fetching');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('Badge renders its label', () => {
    render(<Badge tone="green">ready</Badge>);
    expect(screen.getByText('ready')).toBeInTheDocument();
  });
});
