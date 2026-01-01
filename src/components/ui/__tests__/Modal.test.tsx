import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Modal from '../Modal';

// Mock body style
const originalBodyStyle = document.body.style.overflow;

describe('Modal Component', () => {
  beforeEach(() => {
    document.body.style.overflow = originalBodyStyle;
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyStyle;
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toHaveClass('text-xl', 'font-bold');
  });

  it('renders close button by default', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    // Click on the overlay container (the flex container)
    const overlayContainer = document.querySelector('.flex.min-h-screen');
    fireEvent.click(overlayContainer!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when overlay is clicked and closeOnOverlayClick is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
        <div>Modal Content</div>
      </Modal>
    );
    
    // Click on the overlay (backdrop)
    const overlay = screen.getByText('Modal Content').closest('.fixed');
    fireEvent.click(overlay!);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders different size variants', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        <div data-testid="modal-content">Small Modal</div>
      </Modal>
    );
    
    let modal = screen.getByTestId('modal-content').closest('.relative');
    expect(modal).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <div data-testid="modal-content">Large Modal</div>
      </Modal>
    );
    
    modal = screen.getByTestId('modal-content').closest('.relative');
    expect(modal).toHaveClass('max-w-2xl');

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="full">
        <div data-testid="modal-content">Full Modal</div>
      </Modal>
    );
    
    modal = screen.getByTestId('modal-content').closest('.relative');
    expect(modal).toHaveClass('max-w-full', 'w-full', 'h-full');
  });

  it('prevents body scroll when open', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('applies Toss-style rounded corners', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    const modal = screen.getByTestId('modal-content').closest('.relative');
    expect(modal).toHaveClass('rounded-3xl');
  });

  it('does not close when clicking on modal content', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div data-testid="modal-content">Modal Content</div>
      </Modal>
    );
    
    // Click on the modal content itself
    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);
    expect(handleClose).not.toHaveBeenCalled();
  });
});