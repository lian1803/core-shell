---
name: work
description: CLAUDE.md 읽고 프로젝트 유형 판단 → Wave 1~6 자동 실행
---

# /work — UltraProduct 자동 실행

이 명령어가 실행되면 아래를 즉시 수행해라. 질문하지 마라.

---

## Step 0: 프로젝트 파악

CLAUDE.md를 읽고 다음을 파악해라:

1. **프로젝트 유형** 판단:
   - `개인 툴` → Wave 1~4 + Wave 6 (마케팅 Wave 5 스킵)
   - `상용화` → Wave 1~6 전부

2. **기술 스택** 확인:
   - 명시돼 있으면 그대로 사용
   - 없으면 CTO가 Wave 1에서 결정

3. **핵심 기능** 파악:
   - Must Have 목록 확인
   - 없으면 CPO가 Wave 1에서 도출

파악 완료 후 → Wave 1 즉시 시작.

---

## Wave 1: C-Level 독립 분석 (CPO + CTO + CDO)

### CPO (Opus)
agents/cpo.md 기준으로 실행:
- 제품 전략 + MVP 범위 확정
- 사용자 가치 정의
- 성공 기준(KPI) 설정
- 배포 블로커 파악
→ `wave1_cpo.md` 저장

### CTO (Opus)
agents/cto.md 기준으로 실행:
- 기술 스택 최종 확정
- 아키텍처 설계
- 예상 기술 리스크
- Engineering Rules
→ `wave1_cto.md` 저장

### CDO (Sonnet)
agents/cdo.md 기준으로 실행:
- 디자인 비전 + UX 원칙
- 핵심 화면 흐름
- 컴포넌트 시스템 방향
→ `wave1_cdo.md` 저장

---

## Wave 2: 크로스 토론 + 기획 확정

### CPO ↔ CTO 토론
- CPO 관점: 비즈니스적으로 맞는가
- CTO 관점: 기술적으로 가능한가, 더 나은 방법은
- 합의문 도출 → `wave2_cpo_cto_합의.md` 저장

### CTO ↔ CDO 토론
- CTO: 기술 구현 가능한 디자인인가
- CDO: 기술 제약 내 최고의 UX는
- 합의 → `wave2_cto_cdo_합의.md` 저장

### PM (Sonnet)
agents/pm.md 기준으로 실행:
- 합의문 기반 태스크 분해
- User Story 작성
- 개발 우선순위 정렬
→ `wave2_pm_계획.md` 저장

---

## Wave 3: 구현 (FE + BE 병렬)

### Backend (Opus)
agents/be.md 기준:
- API 전체 구현
- DB 스키마
- 비즈니스 로직
→ `src/backend/` 실제 코드 생성

### Frontend (Sonnet)
agents/fe.md 기준:
- UI 전체 구현
- 백엔드 API 연결
→ `src/frontend/` 실제 코드 생성

---

## Wave 4: 검증 (QA + CTO 통합 리뷰)

### QA (Sonnet)
agents/qa.md 기준:
- 코드 리뷰 + 버그 즉시 수정
- 테스트 시나리오 3개 이상
→ `qa/test_results.md` 저장

### CTO 통합 리뷰 (Opus)
- FE + BE 통합 검증
- Engineering Rules 준수 확인
→ `qa/cto_review.md` 저장

---

## Wave 5: 마케팅 + 배포 (상용화만)

개인 툴이면 스킵 → Wave 6으로.

### 마케팅 (Sonnet)
agents/marketing.md 기준:
- 카피 A/B
- 채널 전략
- 48시간 검증 플랜
- 바이럴 루프
→ `marketing/` 저장

### 배포
- Vercel 배포 가이드
- README.md 생성

---

## Wave 6: Gemini 독립 검증 + 최종 리포트

- 전체 결과물 크로스체크
- 놓친 엣지케이스 발견
- 최종 산출물 목록 + 다음 액션
→ `final_report.md` 저장

---

## 분석 루프 (performance.md 생기면 자동)

agents/analytics.md 기준:
- 퍼널 분석 + 개선안
- FE/BE 수정 지시서
→ Wave 3부터 필요한 부분만 재실행
