import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tabs from '../Tabs';

const mockTabs = [
  {
    key: 'tab1',
    label: 'Tab 1',
    content: <div data-testid="tab1-content">Tab 1 Content</div>
  },
  {
    key: 'tab2',
    label: 'Tab 2',
    content: <div data-testid="tab2-content">Tab 2 Content</div>
  },
  {
    key: 'tab3',
    label: 'Tab 3',
    content: <div data-testid="tab3-content">Tab 3 Content</div>,
    disabled: true
  }
];

const mockTabsWithBadges = [
  {
    key: 'tab1',
    label: 'Tab 1',
    content: <div>Tab 1 Content</div>,
    badge: '5'
  },
  {
    key: 'tab2',
    label: 'Tab 2',
    content: <div>Tab 2 Content</div>,
    badge: 10
  }
];

describe('Tabs Component', () => {
  it('renders all tabs', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('displays active tab content', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    expect(screen.queryByTestId('tab2-content')).not.toBeInTheDocument();
  });

  it('changes active tab when clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    const tab2Button = screen.getByText('Tab 2');
    fireEvent.click(tab2Button);
    
    expect(handleTabChange).toHaveBeenCalledWith('tab2');
  });

  it('does not call onTabChange for disabled tabs', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    const disabledTab = screen.getByText('Tab 3');
    fireEvent.click(disabledTab);
    
    expect(handleTabChange).not.toHaveBeenCalled();
  });

  it('applies disabled styles to disabled tabs', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    const disabledTabButton = screen.getByRole('button', { name: 'Tab 3' });
    expect(disabledTabButton).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('renders different variants', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="default"
      />
    );
    
    let tabContainer = screen.getByRole('button', { name: 'Tab 1' }).parentElement;
    expect(tabContainer).toHaveClass('bg-gray-100', 'rounded-2xl');

    rerender(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="pills"
      />
    );
    
    tabContainer = screen.getByRole('button', { name: 'Tab 1' }).parentElement;
    expect(tabContainer).toHaveClass('gap-2');

    rerender(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="underline"
      />
    );
    
    tabContainer = screen.getByRole('button', { name: 'Tab 1' }).parentElement;
    expect(tabContainer).toHaveClass('border-b', 'border-gray-200');
  });

  it('renders different sizes', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        size="sm"
      />
    );
    
    let tab = screen.getByRole('button', { name: 'Tab 1' });
    expect(tab).toHaveClass('py-2', 'px-3', 'text-sm');

    rerender(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        size="lg"
      />
    );
    
    tab = screen.getByRole('button', { name: 'Tab 1' });
    expect(tab).toHaveClass('py-4', 'px-6', 'text-lg');
  });

  it('renders badges correctly', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabsWithBadges} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies active styles correctly for default variant', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="default"
      />
    );
    
    const activeTab = screen.getByRole('button', { name: 'Tab 1' });
    const inactiveTab = screen.getByRole('button', { name: 'Tab 2' });
    
    expect(activeTab).toHaveClass('bg-white', 'text-primary-400', 'shadow-sm');
    expect(inactiveTab).toHaveClass('text-gray-600');
  });

  it('applies active styles correctly for pills variant', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="pills"
      />
    );
    
    const activeTab = screen.getByRole('button', { name: 'Tab 1' });
    const inactiveTab = screen.getByRole('button', { name: 'Tab 2' });
    
    expect(activeTab).toHaveClass('bg-primary-400', 'text-white', 'shadow-lg');
    expect(inactiveTab).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('applies active styles correctly for underline variant', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        variant="underline"
      />
    );
    
    const activeTab = screen.getByRole('button', { name: 'Tab 1' });
    const inactiveTab = screen.getByRole('button', { name: 'Tab 2' });
    
    expect(activeTab).toHaveClass('border-primary-400', 'text-primary-400');
    expect(inactiveTab).toHaveClass('text-gray-600', 'border-transparent');
  });

  it('applies custom className', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange}
        className="custom-tabs"
      />
    );
    
    const tabsContainer = screen.getByText('Tab 1').closest('.custom-tabs');
    expect(tabsContainer).toBeInTheDocument();
  });

  it('has focus styles for accessibility', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={handleTabChange} 
      />
    );
    
    const tab = screen.getByRole('button', { name: 'Tab 1' });
    expect(tab).toHaveClass('focus:ring-2', 'focus:ring-primary-400', 'focus:ring-offset-2');
  });
});