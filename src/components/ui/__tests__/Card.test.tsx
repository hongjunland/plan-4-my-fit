import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Card from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div data-testid="card-content">Test Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    render(
      <Card>
        <div>Content</div>
      </Card>
    );
    
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-3xl');
  });

  it('renders different padding variants', () => {
    const { rerender } = render(
      <Card padding="sm">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    let card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('p-3');

    rerender(
      <Card padding="lg">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('p-8');

    rerender(
      <Card padding="none">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('p-0');
  });

  it('renders different shadow variants', () => {
    const { rerender } = render(
      <Card shadow="md">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    let card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('shadow-md');

    rerender(
      <Card shadow="lg">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('shadow-lg');

    rerender(
      <Card shadow="none">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('shadow-none');
  });

  it('applies hover styles when hover prop is true', () => {
    render(
      <Card hover>
        <div data-testid="content">Content</div>
      </Card>
    );
    
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('hover:shadow-md', 'hover:scale-[1.02]', 'cursor-pointer');
  });

  it('renders as button when onClick is provided', () => {
    const handleClick = vi.fn();
    render(
      <Card onClick={handleClick}>
        <div>Clickable Content</div>
      </Card>
    );
    
    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary-400');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <Card onClick={handleClick}>
        <div>Clickable Content</div>
      </Card>
    );
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class">
        <div data-testid="content">Content</div>
      </Card>
    );
    
    const card = screen.getByTestId('content').parentElement;
    expect(card).toHaveClass('custom-class');
  });
});