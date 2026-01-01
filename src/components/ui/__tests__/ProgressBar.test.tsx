import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from '../ProgressBar';

describe('ProgressBar Component', () => {
  it('renders with default props', () => {
    render(<ProgressBar value={50} />);
    
    const progressContainer = document.querySelector('.w-full.bg-gray-200');
    expect(progressContainer).toBeInTheDocument();
    
    const progressFill = document.querySelector('.bg-primary-400');
    expect(progressFill).toBeInTheDocument();
  });

  it('displays correct progress value', () => {
    render(<ProgressBar value={75} showLabel />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('normalizes values outside 0-100 range', () => {
    const { rerender } = render(<ProgressBar value={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<ProgressBar value={-10} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders different color variants', () => {
    const { rerender } = render(<ProgressBar value={50} color="primary" />);
    
    let progressFill = document.querySelector('.bg-primary-400');
    expect(progressFill).toBeInTheDocument();

    rerender(<ProgressBar value={50} color="success" />);
    progressFill = document.querySelector('.bg-success-500');
    expect(progressFill).toBeInTheDocument();

    rerender(<ProgressBar value={50} color="warning" />);
    progressFill = document.querySelector('.bg-warning-500');
    expect(progressFill).toBeInTheDocument();

    rerender(<ProgressBar value={50} color="error" />);
    progressFill = document.querySelector('.bg-error-500');
    expect(progressFill).toBeInTheDocument();
  });

  it('renders different size variants', () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    
    let progressContainer = document.querySelector('.h-2');
    expect(progressContainer).toBeInTheDocument();

    rerender(<ProgressBar value={50} size="md" />);
    progressContainer = document.querySelector('.h-3');
    expect(progressContainer).toBeInTheDocument();

    rerender(<ProgressBar value={50} size="lg" />);
    progressContainer = document.querySelector('.h-4');
    expect(progressContainer).toBeInTheDocument();
  });

  it('shows label when showLabel is true', () => {
    render(<ProgressBar value={60} showLabel />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows custom label', () => {
    render(<ProgressBar value={80} showLabel label="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ProgressBar value={50} className="custom-progress" />);
    
    const container = document.querySelector('.custom-progress');
    expect(container).toBeInTheDocument();
  });

  it('applies correct width style based on value', () => {
    render(<ProgressBar value={30} />);
    
    const progressFill = document.querySelector('[style*="width: 30%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('has rounded corners (Toss style)', () => {
    render(<ProgressBar value={50} />);
    
    const progressContainer = document.querySelector('.rounded-full');
    expect(progressContainer).toBeInTheDocument();
  });

  it('includes animation classes when animated is true', () => {
    render(<ProgressBar value={50} animated />);
    
    const progressFill = document.querySelector('.transition-all.duration-700');
    expect(progressFill).toBeInTheDocument();
  });

  it('handles zero value correctly', () => {
    render(<ProgressBar value={0} showLabel />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
    const progressFill = document.querySelector('[style*="width: 0%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('handles 100% value correctly', () => {
    render(<ProgressBar value={100} showLabel />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    const progressFill = document.querySelector('[style*="width: 100%"]');
    expect(progressFill).toBeInTheDocument();
  });
});