import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { User, Search } from 'lucide-react';
import Input from '../Input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('rounded-2xl', 'min-h-[56px]');
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('border-error-500', 'bg-error-50');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-error-500');
  });

  it('renders with helper text', () => {
    render(<Input helperText="Enter at least 8 characters" placeholder="Enter text" />);
    
    expect(screen.getByText('Enter at least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Enter at least 8 characters')).toHaveClass('text-gray-600');
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<User data-testid="user-icon" />} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('pl-12');
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<Search data-testid="search-icon" />} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('pr-12');
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Input variant="default" placeholder="Default" />);
    
    let input = screen.getByPlaceholderText('Default');
    expect(input).toHaveClass('border-2', 'border-gray-200', 'bg-white');

    rerender(<Input variant="filled" placeholder="Filled" />);
    
    input = screen.getByPlaceholderText('Filled');
    expect(input).toHaveClass('border-0', 'bg-gray-50');
  });

  it('handles password type with toggle', () => {
    render(<Input type="password" placeholder="Enter password" />);
    
    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button');
    
    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toBeInTheDocument();
    
    // Click to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    
    // Click to hide password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles input changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test value');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="Enter text" />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('handles both left icon and password toggle', () => {
    render(
      <Input 
        type="password" 
        leftIcon={<User data-testid="user-icon" />} 
        placeholder="Enter password" 
      />
    );
    
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveClass('pl-12', 'pr-12');
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});