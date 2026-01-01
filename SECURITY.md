# 보안 가이드 - Plan4MyFit

## 🚨 중요한 보안 사고 발생

**2025년 1월 2일**: Google OAuth 설정 문서에 실제 Supabase URL과 API 키가 노출되는 보안 사고가 발생했습니다.

### 즉시 조치 사항
- [x] 문서에서 민감한 정보 제거 완료
- [x] .env.local 파일 플레이스홀더로 교체 완료
- [x] .gitignore에 환경 파일 추가 완료
- [ ] **Supabase 프로젝트 API 키 재생성 필요**
- [ ] **OpenAI API 키 재생성 필요**

## 🔐 보안 원칙

### 1. 환경 변수 관리
- **절대 금지**: 실제 API 키를 코드나 문서에 하드코딩
- **사용**: 환경 변수 파일 (.env.local, .env.production)
- **Git 제외**: 모든 .env.* 파일은 .gitignore에 포함

### 2. 문서 작성 시 주의사항
- 플레이스홀더 사용: `YOUR-API-KEY`, `YOUR-PROJECT-ID`
- 실제 값 대신 예시 형식 제공
- 설정 방법만 안내, 실제 값은 별도 관리

### 3. 개발 환경 보안
```bash
# ✅ 올바른 방법
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_OPENAI_API_KEY=YOUR-OPENAI-API-KEY

# ❌ 잘못된 방법 (실제 키 노출)
VITE_OPENAI_API_KEY=sk-proj-[ACTUAL-KEY-HERE]
```

## 🛡️ 프로덕션 보안 체크리스트

### 환경 변수
- [ ] 모든 API 키가 Vercel 환경 변수에서만 설정됨
- [ ] 개발/스테이징/프로덕션 환경별로 다른 키 사용
- [ ] 환경 변수 파일이 Git에 커밋되지 않음

### 코드 보안
- [ ] console.log에서 민감한 정보 제거
- [ ] 프로덕션에서 디버그 로그 비활성화
- [ ] API 응답에서 민감한 데이터 필터링

### 인프라 보안
- [ ] HTTPS 강제 사용
- [ ] 보안 헤더 설정 (CSP, HSTS 등)
- [ ] CORS 설정 검토
- [ ] Rate limiting 적용

## 🔄 API 키 순환 계획

### 정기 순환 (3개월마다)
1. **Supabase API 키**
   - 새 anon key 생성
   - 환경 변수 업데이트
   - 이전 키 비활성화

2. **OpenAI API 키**
   - 새 API 키 생성
   - 환경 변수 업데이트
   - 이전 키 삭제

3. **Google OAuth 클라이언트**
   - 필요시 새 클라이언트 생성
   - 리다이렉트 URL 업데이트

## 🚨 보안 사고 대응 절차

### 1. 즉시 대응 (1시간 이내)
1. 노출된 API 키 즉시 비활성화/삭제
2. 새 API 키 생성 및 환경 변수 업데이트
3. 영향 범위 파악 및 문서화

### 2. 단기 대응 (24시간 이내)
1. 관련 로그 분석 (무단 사용 여부 확인)
2. 보안 설정 강화
3. 팀원들에게 보안 가이드 재교육

### 3. 장기 대응 (1주일 이내)
1. 보안 정책 업데이트
2. 자동화된 보안 검사 도구 도입
3. 정기 보안 감사 계획 수립

## 📋 보안 도구 및 모니터링

### 개발 도구
- **git-secrets**: Git 커밋 전 민감한 정보 검사
- **ESLint 규칙**: console.log 및 하드코딩된 키 검출
- **pre-commit hooks**: 커밋 전 보안 검사

### 모니터링
- **Sentry**: 에러 모니터링 (민감한 정보 필터링)
- **Vercel Analytics**: 트래픽 모니터링
- **Supabase 대시보드**: 인증 및 API 사용량 모니터링

## 📞 보안 사고 신고

보안 취약점을 발견하면 즉시 다음으로 연락:
- **개발팀 리드**: [이메일 주소]
- **보안 담당자**: [이메일 주소]

## 📚 추가 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel 보안 가이드](https://vercel.com/docs/security)
- [Supabase 보안 모범 사례](https://supabase.com/docs/guides/auth/security)
- [OpenAI API 보안](https://platform.openai.com/docs/guides/safety-best-practices)

---

**마지막 업데이트**: 2025년 1월 2일  
**다음 보안 검토**: 2025년 4월 2일