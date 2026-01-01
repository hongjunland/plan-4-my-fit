import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';
import Input from '../Input';
import Modal from '../Modal';

describe('Accessibility Tests', () => {
  describe('Button Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Button aria-label="테스트 버튼" aria-describedby="button-help">
          클릭하세요
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '테스트 버튼');
      expect(button).toHaveAttribute('aria-describedby', 'button-help');
    });

    it('should indicate loading state to screen readers', () => {
      render(<Button loading>로딩 중</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should meet minimum touch target size', () => {
      render(<Button>버튼</Button>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check minimum height (48px for WCAG AA compliance)
      expect(styles.minHeight).toBe('48px');
      expect(styles.minWidth).toBe('48px');
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>버튼</Button>);
      
      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
      
      // Should respond to Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Input Accessibility', () => {
    it('should have proper label association', () => {
      render(<Input label="이메일" />);
      
      const input = screen.getByLabelText('이메일');
      expect(input).toBeInTheDocument();
    });

    it('should indicate required fields', () => {
      render(<Input label="비밀번호" required />);
      
      const label = screen.getByText('비밀번호');
      expect(label).toBeInTheDocument();
      
      // Should have required indicator
      const requiredIndicator = screen.getByLabelText('필수 입력');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should associate error messages with input', () => {
      render(<Input label="이메일" error="유효하지 않은 이메일입니다" />);
      
      const input = screen.getByLabelText('이메일');
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveTextContent('유효하지 않은 이메일입니다');
    });

    it('should have accessible password toggle', () => {
      render(<Input type="password" label="비밀번호" />);
      
      const toggleButton = screen.getByLabelText('비밀번호 보기');
      expect(toggleButton).toBeInTheDocument();
      
      // Click to show password
      fireEvent.click(toggleButton);
      
      const hideButton = screen.getByLabelText('비밀번호 숨기기');
      expect(hideButton).toBeInTheDocument();
    });

    it('should meet minimum touch target size', () => {
      render(<Input label="테스트" />);
      
      const input = screen.getByLabelText('테스트');
      const styles = window.getComputedStyle(input);
      
      // Check minimum height (56px for better mobile experience)
      expect(styles.minHeight).toBe('56px');
    });
  });

  describe('Modal Accessibility', () => {
    it('should have proper dialog role and ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="테스트 모달">
          모달 내용
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('should focus trap within modal', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="테스트 모달">
          <button>첫 번째 버튼</button>
          <button>두 번째 버튼</button>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      const firstButton = screen.getByText('첫 번째 버튼');
      const secondButton = screen.getByText('두 번째 버튼');
      
      // Modal should be focused initially
      expect(modal).toHaveFocus();
      
      // Tab should move to first button
      fireEvent.keyDown(modal, { key: 'Tab' });
      expect(firstButton).toHaveFocus();
    });

    it('should close on Escape key', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="테스트 모달">
          모달 내용
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal, { key: 'Escape' });
      
      expect(handleClose).toHaveBeenCalled();
    });

    it('should have accessible close button', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="테스트 모달">
          모달 내용
        </Modal>
      );
      
      const closeButton = screen.getByLabelText('모달 닫기');
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('Color Contrast', () => {
    it('should use high contrast colors for text', () => {
      render(<Button variant="primary">기본 버튼</Button>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Primary button should have white text on blue background
      expect(styles.color).toBe('rgb(255, 255, 255)'); // white
      expect(styles.backgroundColor).toContain('rgb(49, 130, 246)'); // primary-400
    });

    it('should use accessible gray colors', () => {
      render(<Button variant="secondary">보조 버튼</Button>);
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Should use improved contrast gray colors
      expect(styles.color).toBe('rgb(17, 24, 39)'); // gray-900
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between interactive elements', () => {
      render(
        <div>
          <Button>첫 번째 버튼</Button>
          <Input label="입력 필드" />
          <Button>두 번째 버튼</Button>
        </div>
      );
      
      const firstButton = screen.getByText('첫 번째 버튼');
      const input = screen.getByLabelText('입력 필드');
      const secondButton = screen.getByText('두 번째 버튼');
      
      // Should be able to tab through elements
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      expect(input).toHaveFocus();
      
      fireEvent.keyDown(input, { key: 'Tab' });
      expect(secondButton).toHaveFocus();
    });
  });
});