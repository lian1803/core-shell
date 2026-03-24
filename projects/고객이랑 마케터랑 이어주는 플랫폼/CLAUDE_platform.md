# 마케팅 매칭 플랫폼

## 기술 스택
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + DB + Storage + RLS)
- Vercel 배포

## 자율 실행 규칙 ⚡
- 파일 수정/생성/삭제 시 허가 요청 금지
- git add, commit, push 허가 없이 직접 실행
- 중간에 나한테 확인하거나 질문 금지
- 작업 완료 후 결과만 보고

## 오류 해결 루프 (반드시 이 순서로)
1. 오류 재현 → `npm run build` 로컬 빌드로 확인
2. 수정 → push → Vercel 배포 대기
3. 배포 완료 후 실제 URL 접속해서 동작 확인
4. 오류 없으면 → 나한테 "완료" 보고
5. 오류 있으면 → 루프 반복 (나한테 묻지 말 것)
- 3회 이내 해결 안 되면 → Opus 모델로 전환해서 재시도
- Opus로도 3회 실패 → 그때만 나한테 보고

## 검증 기준 (완료 조건)
- 로컬 `npm run build` 에러 없음
- Vercel 배포 성공
- 실제 URL에서 브라우저 콘솔 에러 없음
- 주요 페이지 (/, /login, /signup, /dashboard) 정상 렌더링 확인
- 위 4가지 모두 통과해야 완료

## 병렬 에이전트 활용
- 오류 원인이 여러 곳일 경우 서브에이전트 분리해서 병렬 수정
- Auth 오류 → Auth Agent
- DB/RLS 오류 → DB Agent  
- UI hydration 오류 → UI Agent
- 각 에이전트 수정 완료 후 통합 → 빌드 검증

## 금지 사항
- 완료 조건 미달성 상태에서 나한테 보고 금지
- Must(M1~M6) 외 기능 구현 금지
- 환경변수 하드코딩 금지
- 중간 확인 요청 금지
```

---

Claude Code에 던질 명령어:
```
Application error 나고있어. CLAUDE.md 읽고 오류 해결 루프 돌려.
완료 조건 4가지 전부 통과할 때까지 나한테 묻지 말고 혼자 해결해.# Build verified Mon, Mar 16, 2026  5:43:15 AM
