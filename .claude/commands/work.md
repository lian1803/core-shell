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

4. **리안 원본 요구사항** 기억:
   - CLAUDE.md에 명시된 가격, 타겟, 핵심 방향을 기록해둬라
   - 이후 Wave에서 AI가 변경 제안해도 리안이 직접 확인해야 함

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

## ⛔ 리안 컨펌 (Wave 2 완료 후, Wave 3 시작 전)

**반드시 여기서 멈추고 리안에게 확인받아라. 자동으로 넘어가지 마라.**

다음 형식으로 핵심 결정 사항을 요약해서 보여줘:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 리안 컨펌 필요 — Wave 2 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 원래 요구사항 (CLAUDE.md 기준)
   [CLAUDE.md에서 리안이 명시한 가격/타겟/방향 원문]

🔸 AI가 변경한 사항
   [Wave 1~2에서 원래와 달라진 결정들. 없으면 "변경 없음"]

📌 확정된 핵심 결정
   [가격]
   [무료체험 기간]
   [MVP 범위]
   [발행 방식]
   [기술 스택]
   [플랜 구조]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
수정할 거 있으면 말해. 없으면 "진행해" 입력.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

리안이 수정 요청하면:
- 해당 결정을 수정하고 합의문 업데이트
- 수정 반영 후 다시 컨펌 요약 보여주기

리안이 "진행해" 입력하면 → Wave 3 시작.

---

## Wave 3: 구현 (FE + BE 병렬)

### Backend (Sonnet)
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

### CTO 통합 리뷰 (Sonnet)
- FE + BE 통합 검증
- Engineering Rules 준수 확인
→ `qa/cto_review.md` 저장

---

## Wave 5: 마케팅 실행 + 배포 (상용화만)

개인 툴이면 스킵 → Wave 6으로.

### Wave 5-1: 수아 — 채널 판단 (Sonnet)
agents/marketing.md 기준으로 실행:
- 프로젝트 유형(국내/글로벌) + 타겟 행동 패턴 분석
- 마케팅 채널 TOP 3 선정 (이유 포함)
- 수익화 방향 확정
- 계정 전략 (기존 재활용 vs 신규 전용 계정) 추천
→ `marketing/wave5_1_채널전략.md` 저장

### Wave 5-2: 수아 — 채널별 실제 콘텐츠 생성 (Sonnet)
선정된 채널별 바로 쓸 수 있는 완성본 생성:
- **인스타/스레드**: 캡션 3개 (A/B/C) + 이미지 프롬프트 + 해시태그 30개
- **네이버 블로그**: SEO 최적화 글 전문 (제목 포함)
- **네이버 카페**: 자연스러운 홍보글 (광고 티 안 나게)
- **레딧**: 영어 게시글 전문 (r/SaaS, r/SideProject 등 subreddit 지정)
- **메타광고**: 카피 3세트 + 타겟팅 설정값 + 예산 계획
→ `marketing/wave5_2_콘텐츠.md` 저장

### Wave 5-3: 수아 — 실행 스크립트 생성 (Sonnet)
선정된 채널별 Python 실행 스크립트 생성:
- `marketing/scripts/post_instagram.py` — Meta Graph API
- `marketing/scripts/post_naver_blog.py` — Playwright 자동화
- `marketing/scripts/post_naver_cafe.py` — Playwright 자동화 (하루 2~3건 제한 포함)
- `marketing/scripts/post_reddit.py` — PRAW
- `marketing/scripts/run_meta_ads.py` — Meta Ads API (일일 예산 상한 하드코딩)
- `marketing/scripts/requirements.txt` — 필요 패키지
- `marketing/scripts/.env.example` — 필요 API 키 목록

스크립트 규칙:
- 광고 예산 일일 상한 반드시 포함 (기본 3만원, 하드코딩)
- 네이버 자동화: 하루 최대 3건 제한 코드 포함
- 실행 전 dry_run 모드 지원 (실제 발행 없이 미리보기)

### ⛔ Wave 5-4: 리안 컨펌 (발행 전 필수)

**반드시 여기서 멈추고 리안에게 확인받아라.**

다음 형식으로 보여줘:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📣 마케팅 컨펌 필요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 채널 TOP 3: [채널1 / 채널2 / 채널3]
💰 메타광고 예산: 하루 [금액]원
👤 계정 전략: [기존 재활용 / 신규 전용 계정]

📝 콘텐츠 미리보기:
[채널별 초안 요약]

🔧 실행 스크립트: marketing/scripts/ 생성 완료
   → API 키 넣으면 바로 실행 가능

수정할 거 있으면 말해. 없으면 "발행해" 입력.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

리안이 수정 요청하면 해당 콘텐츠/설정 수정 후 다시 보여줘.
"발행해" 입력하면 → 실행 스크립트 경로 안내 후 Wave 5-5로.

### Wave 5-5: 영진 — 성과 추적 루프 설계 (Sonnet)
agents/youngjin.md 기준으로 실행:
- 채널별 성과 수집 스크립트 생성 (`marketing/scripts/collect_metrics.py`)
- 3일 후 실행 → 분석 → 수아 콘텐츠 수정 → 재발행 루프 설계
- `marketing/wave5_5_성과루프.md` 저장 (언제 뭘 확인할지 체크리스트)

### 배포
- Vercel 배포 가이드
- README.md 생성

---

## Wave 6: Gemini 독립 검증 (자동 실행)

Wave 5까지 모든 산출물이 생성된 후, 진짜 Gemini API(3.1 Pro)를 통한 독립 검증을 자동 실행한다.

**Claude가 직접 검증하지 마라. 아래 명령어를 Bash로 실행해라.**

```bash
# 현재 프로젝트 디렉토리에서 실행
LAINCP_ROOT="$(cd ../.. 2>/dev/null && pwd || cd .. 2>/dev/null && pwd)"
"${LAINCP_ROOT}/lian_company/venv/Scripts/python.exe" "${LAINCP_ROOT}/lian_company/verify_gemini.py" "$(pwd)"
```

스크립트가 `final_report.md`를 현재 프로젝트 폴더에 자동 저장한다.

---

## Wave 6.5: CRITICAL 자동 수정 (1회만)

final_report.md를 읽고 다음을 수행해라:

1. **CRITICAL 이슈가 있는지 확인** — `[CRITICAL]` 태그가 붙은 항목을 모두 추출
2. **CRITICAL이 있으면**:
   - 해당 이슈를 코드에서 직접 수정
   - 수정 내용을 `wave6_fixes.md`에 기록 (어떤 CRITICAL을 어떻게 고쳤는지)
   - 수정 완료 후 Gemini 재검증 1회 실행:
     ```bash
     LAINCP_ROOT="$(cd ../.. 2>/dev/null && pwd || cd .. 2>/dev/null && pwd)"
     "${LAINCP_ROOT}/lian_company/venv/Scripts/python.exe" "${LAINCP_ROOT}/lian_company/verify_gemini.py" "$(pwd)"
     ```
   - 재검증 후에도 CRITICAL이 남으면 → **수정하지 말고** 리안에게 "수동 확인 필요"로 알려줘라
3. **CRITICAL이 없으면**:
   - HIGH 이슈 목록만 요약해서 리안에게 보여줘라
   - 자동 수정하지 마라 (HIGH는 리안이 판단)

**재검증은 최대 1회만. 무한 루프 금지.**

---

## 최종 보고

모든 Wave 완료 후 리안에게 다음을 보여줘라:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ UltraProduct 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Gemini 검증 결과: [준비 완료 / 조건부 준비 / 미준비]

🔧 자동 수정한 CRITICAL 이슈: X건
⚠️ 남은 HIGH 이슈: X건 (리안 확인 필요)

📁 산출물 위치: [경로]
📋 검증 리포트: final_report.md

🚀 다음 단계: [배포 가이드 or 수정 필요 사항]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 분석 루프 (performance.md 생기면 자동)

agents/analytics.md 기준:
- 퍼널 분석 + 개선안
- FE/BE 수정 지시서
→ Wave 3부터 필요한 부분만 재실행

---

## 모델 배정 기준

| 역할 | 모델 | 이유 |
|------|------|------|
| CPO | Opus | 전략 판단은 깊이가 필요 |
| CTO | Opus | 아키텍처 결정은 되돌리기 비쌈 |
| CDO | Sonnet | 디자인 방향은 Sonnet으로 충분 |
| PM | Sonnet | 태스크 분해는 구조적 작업 |
| FE | Sonnet | 코드 작성은 Sonnet이 충분 |
| BE | Sonnet | 코드 작성은 Sonnet이 충분 |
| QA | Sonnet | 버그 탐지 + 수정 |
| CTO 리뷰 | Sonnet | 코드 리뷰 (아키텍처는 이미 결정됨) |
| 마케팅 | Sonnet | 카피/전략은 Sonnet으로 충분 |
| Wave 6 검증 | Gemini API (외부) | 진짜 독립 검증 |
