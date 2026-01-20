# TypeScript Best Practices

## Type Safety

### Strict Mode
- `strict: true` 항상 활성화
- `any` 타입 사용 금지 (불가피한 경우 `unknown` 사용)

```typescript
// ✅ Good
const data: unknown = fetchData();
if (typeof data === 'string') {
  console.log(data.toUpperCase());
}

// ❌ Bad
const data: any = fetchData();
```

### Type vs Interface
- 객체 타입: `interface` 선호
- 유니온/인터섹션: `type` 사용

```typescript
// ✅ 객체는 interface
interface User {
  id: string;
  name: string;
}

// ✅ 유니온은 type
type Status = 'idle' | 'loading' | 'success' | 'error';
```

## Type Definitions

### Props Types
- 컴포넌트 Props는 명시적으로 정의

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}
```

### Generic Types
- 재사용 가능한 타입에 제네릭 활용

```typescript
interface ApiResponse<T> {
  data: T;
  error: string | null;
  isLoading: boolean;
}
```

### Utility Types
- `Partial<T>`, `Required<T>`, `Pick<T>`, `Omit<T>` 활용

```typescript
type UpdateUser = Partial<User>;
type UserPreview = Pick<User, 'id' | 'name'>;
```

## Null Handling

### Optional Chaining
```typescript
// ✅ Good
const name = user?.profile?.name;

// ❌ Bad
const name = user && user.profile && user.profile.name;
```

### Nullish Coalescing
```typescript
// ✅ Good
const value = data ?? 'default';

// ❌ Bad (0이나 ''도 대체됨)
const value = data || 'default';
```

## Function Types

### Arrow Functions
```typescript
// ✅ 타입 명시
const add = (a: number, b: number): number => a + b;

// ✅ 함수 타입 정의
type Calculator = (a: number, b: number) => number;
const multiply: Calculator = (a, b) => a * b;
```

### Async Functions
```typescript
// ✅ Promise 반환 타입 명시
const fetchUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
```

## Enums vs Union Types

```typescript
// ✅ Union Types 선호 (tree-shaking 가능)
type Direction = 'up' | 'down' | 'left' | 'right';

// ⚠️ Enum은 필요한 경우에만
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
}
```

## Type Guards

```typescript
// ✅ 타입 가드 함수
const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && value !== null && 'id' in value;
};

if (isUser(data)) {
  console.log(data.id); // User 타입으로 추론
}
```

## Import/Export

```typescript
// ✅ Named exports 선호
export { UserService };
export type { User, UserProfile };

// ✅ Type-only imports
import type { User } from './types';
```
