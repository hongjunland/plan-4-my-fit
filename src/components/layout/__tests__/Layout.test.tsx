import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Layout, { MobileContainer, ContentWrapper } from '../Layout';

// Mock the Outlet component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  };
});

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Layout Component', () => {
  it('renders with default props', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    // Check for header title instead of loading text since Outlet is mocked
    expect(screen.getByText('헬스 루틴 플래너')).toBeInTheDocument();
  });

  it('renders without header when showHeader is false', () => {
    render(
      <LayoutWrapper>
        <Layout showHeader={false} />
      </LayoutWrapper>
    );
    
    // Header should not add top padding
    const main = screen.getByRole('main');
    expect(main).not.toHaveClass('pt-[72px]');
  });

  it('renders without bottom navigation when showBottomNav is false', () => {
    render(
      <LayoutWrapper>
        <Layout showBottomNav={false} />
      </LayoutWrapper>
    );
    
    // Main should not have bottom padding
    const main = screen.getByRole('main');
    expect(main).not.toHaveClass('pb-[80px]');
  });
});

describe('MobileContainer Component', () => {
  it('renders children with mobile container styles', () => {
    render(
      <MobileContainer>
        <div data-testid="child">Content</div>
      </MobileContainer>
    );
    
    const container = screen.getByTestId('child').parentElement;
    expect(container).toHaveClass('max-w-mobile');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('ContentWrapper Component', () => {
  it('renders with default padding', () => {
    render(
      <ContentWrapper>
        <div data-testid="content">Content</div>
      </ContentWrapper>
    );
    
    const wrapper = screen.getByTestId('content').parentElement;
    expect(wrapper).toHaveClass('px-4', 'py-4');
  });

  it('renders without padding when noPadding is true', () => {
    render(
      <ContentWrapper noPadding>
        <div data-testid="content">Content</div>
      </ContentWrapper>
    );
    
    const wrapper = screen.getByTestId('content').parentElement;
    expect(wrapper).not.toHaveClass('px-4', 'py-4');
  });
});