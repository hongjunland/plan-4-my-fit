# Testing Best Practices

## Testing Framework

- **Vitest**: 단위 테스트, 통합 테스트
- **Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트

## Test Structure

### AAA Pattern
```typescript
describe('UserService', () => {
  it('should create a new user', async () => {
    // Arrange (준비)
    const userData = { name: 'John', email: 'john@example.com' };
    
    // Act (실행)
    const result = await userService.create(userData);
    
    // Assert (검증)
    expect(result.name).toBe('John');
  });
});
```

### Naming Convention
```typescript
// ✅ Good - 행동과 기대 결과 명시
it('should return error when email is invalid', () => {});
it('should redirect to login when not authenticated', () => {});

// ❌ Bad
it('test email', () => {});
it('works', () => {});
```

## Component Testing

### Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Query Priority
1. `getByRole` - 접근성 기반 (권장)
2. `getByLabelText` - 폼 요소
3. `getByText` - 텍스트 콘텐츠
4. `getByTestId` - 최후의 수단

```typescript
// ✅ Good
screen.getByRole('button', { name: '저장' });
screen.getByLabelText('이메일');

// ❌ Bad
screen.getByTestId('save-button');
```

## Mocking

### Mock Functions
```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
```

### Mock Modules
```typescript
vi.mock('../services/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'John' }),
}));
```

### Spy
```typescript
const spy = vi.spyOn(console, 'log');
// ... 테스트 실행
expect(spy).toHaveBeenCalledWith('expected message');
```

## Async Testing

```typescript
// ✅ async/await 사용
it('should fetch user data', async () => {
  render(<UserProfile userId="1" />);
  
  // waitFor로 비동기 결과 대기
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});

// ✅ findBy 쿼리 사용 (자동 대기)
const element = await screen.findByText('John');
```

## Test Coverage

### 목표
- 핵심 비즈니스 로직: 80% 이상
- 유틸리티 함수: 90% 이상
- UI 컴포넌트: 주요 인터랙션 커버

### 커버리지 확인
```bash
pnpm test --coverage
```

## Best Practices

### DO ✅
- 사용자 관점에서 테스트
- 독립적인 테스트 작성
- 의미 있는 테스트 이름
- 엣지 케이스 테스트

### DON'T ❌
- 구현 세부사항 테스트
- 테스트 간 의존성
- 과도한 모킹
- 스냅샷 테스트 남용

## Test Commands

```bash
# 전체 테스트 실행
pnpm test

# 특정 파일 테스트
pnpm test src/services/auth.test.ts

# watch 모드
pnpm test --watch

# 커버리지 리포트
pnpm test --coverage

# UI 모드
pnpm test --ui
```
