# Git Best Practices

## Commit Messages

### Conventional Commits
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
| Type | 설명 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 (기능 변경 없음) |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정 변경 |

### Examples
```bash
# ✅ Good
feat(auth): 구글 로그인 기능 추가
fix(calendar): UTC 시간대 버그 수정
refactor(hooks): useAuth 훅 최적화

# ❌ Bad
update code
fix bug
WIP
```

## Branch Strategy

### Branch Naming
```
main          # 프로덕션
develop       # 개발 통합
feature/*     # 기능 개발
fix/*         # 버그 수정
hotfix/*      # 긴급 수정
```

### Examples
```bash
feature/google-calendar-integration
fix/login-redirect-issue
hotfix/critical-security-patch
```

## Workflow

### Feature Development
```bash
# 1. develop에서 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 작업 후 커밋
git add .
git commit -m "feat: 새 기능 구현"

# 3. push 및 PR 생성
git push origin feature/new-feature
```

### Before Commit
- 린트 체크: `pnpm lint`
- 타입 체크: `pnpm type-check`
- 테스트: `pnpm test`

## .gitignore

### 필수 제외 항목
```
# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

## Security

### 절대 커밋하지 말 것
- API 키, 시크릿
- `.env` 파일
- 개인 정보
- 인증서, 키 파일

### 실수로 커밋한 경우
```bash
# 히스토리에서 파일 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch <file>" \
  --prune-empty --tag-name-filter cat -- --all
```

## Tips

### Useful Commands
```bash
# 마지막 커밋 수정
git commit --amend

# 특정 커밋으로 되돌리기
git revert <commit-hash>

# 변경사항 임시 저장
git stash
git stash pop

# 브랜치 정리
git branch -d feature/completed
```
