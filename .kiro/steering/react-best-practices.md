# React Best Practices

## Component Patterns

### Functional Components
- 항상 함수형 컴포넌트 사용
- Props는 구조 분해 할당으로 받기
- 컴포넌트 이름은 PascalCase

```tsx
// ✅ Good
const UserProfile = ({ name, email }: UserProfileProps) => {
  return <div>{name}</div>;
};

// ❌ Bad
function userProfile(props) {
  return <div>{props.name}</div>;
}
```

### Custom Hooks
- `use` 접두사 사용
- 단일 책임 원칙 준수
- 재사용 가능하게 설계

```tsx
// ✅ Good
const useAuth = () => {
  const [user, setUser] = useState(null);
  // ...
  return { user, login, logout };
};
```

## State Management

### useState
- 관련 상태는 객체로 그룹화
- 불필요한 상태 최소화

### useEffect
- 의존성 배열 정확히 명시
- cleanup 함수 필수
- 무한 루프 주의

```tsx
// ✅ Good
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, [dependency]);
```

### React Query (TanStack Query)
- 서버 상태는 React Query 사용
- 캐싱 전략 활용
- staleTime, cacheTime 적절히 설정

## Performance

### Memoization
- `useMemo`: 비용이 큰 계산에만 사용
- `useCallback`: 자식 컴포넌트에 전달하는 함수에 사용
- `React.memo`: 리렌더링 방지가 필요한 컴포넌트에 사용

```tsx
// ✅ 필요한 경우에만
const memoizedValue = useMemo(() => expensiveCalculation(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a), [a]);
```

### Code Splitting
- `React.lazy`와 `Suspense` 활용
- 라우트 단위로 분할

```tsx
const LazyComponent = lazy(() => import('./HeavyComponent'));
```

## Accessibility (a11y)

- 시맨틱 HTML 사용 (`button`, `nav`, `main` 등)
- `aria-*` 속성 적절히 사용
- 키보드 네비게이션 지원
- 최소 터치 영역 48px

## File Structure

```
components/
├── ui/           # 기본 UI 컴포넌트
├── forms/        # 폼 관련 컴포넌트
├── layout/       # 레이아웃 컴포넌트
└── [feature]/    # 기능별 컴포넌트
```

## Naming Conventions

- 컴포넌트: `PascalCase.tsx`
- 훅: `useCamelCase.ts`
- 유틸리티: `camelCase.ts`
- 상수: `UPPER_SNAKE_CASE`
- 테스트: `*.test.tsx`
