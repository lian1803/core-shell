# 진행 상태

> Claude Code 켤 때마다 여기부터 확인. 마지막 업데이트: 2026-03-26

---

## 마지막 세션 (2026-03-26 — Wave 5 마케팅 전략 완료)

**뭘 했나 (2026-03-26 밤 세션):**
소상공인 영업툴 Wave 3 CTO 통합 리뷰 + 버그 즉시 수정.

**CTO 리뷰 결과: PASS (버그 6개 발견 → 즉시 수정 완료)**

**발견 및 수정한 버그 (CTO 리뷰):**
1. [치명] `main.py` result_page — messages/key_metrics/score_items 변수 누락 → 추가
2. [치명] messages 구조 불일치 — BE 출력({first:{type,text,label}, second:str}) vs FE 기대({first:{versions}, second:{text}}) → _build_template_messages() 변환 함수 추가
3. [치명] `history.sales_priority` 필드 없음 — 모델은 priority_tag인데 템플릿이 sales_priority 참조 → 동적 속성 변환 추가
4. [치명] /history, /batch 페이지 라우터 누락 — 404 뜨던 것 → main.py에 페이지 라우터 추가
5. [중간] `batch.py` BackgroundTasks 오용 — add_task(asyncio.create_task, _run()) → add_task(_run)으로 수정
6. [중간] `crawl.py` 신규 필드 누락 — DiagnosisHistory 저장 시 industry_type/priority_tag/competitor/messages 없음 → 경쟁사 크롤링+우선순위+메시지 생성 로직 추가

**이전 QA 신규 생성 (Wave 3 FE/BE):**
- `config/industry_weights.py`, `services/message_generator.py`, `services/competitor.py`, `services/batch_processor.py`
- `routers/message.py`, `routers/batch.py`, `qa/test_results.md`
- `templates/result.html`, `templates/history.html`, `templates/batch.html`

**이전 QA 수정:**
- `services/scorer.py`, `services/ppt_generator.py`, `models.py`, `routers/__init__.py`, `requirements.txt`

**다음 세션에서 이어할 것:**
- [ ] **즉시 실행**: `cd naver-diagnosis && pip install openpyxl`
- [ ] **즉시 실행**: `.env` 파일에 `DB_RESET=true` 추가 → 서버 재시작 → 제거
- [ ] 단건 진단 1건 테스트 (양주 미용실) → /result/{id} 페이지 렌더링 확인
- [ ] 메시지 탭 4개 정상 표시 확인
- [ ] xlsx 배치 처리 5개 업체 테스트
- [ ] lian_company/.env 생성 후 파이프라인 테스트

---

## 리안 컴퍼니 (기획 엔진)

| 항목 | 상태 |
|------|------|
| 에이전트 코드 | ✅ 완료 (멀티 AI: Perplexity/GPT-4o/Gemini/Claude) |
| 패키지 설치 | ✅ 완료 (openai, google-genai, anthropic) |
| jongbum.py 시장 리서치 | ✅ 완료 (서윤/태호/하은 데이터 → CLAUDE.md에 포함) |
| .env 파일 | ❌ 없음 — `lian_company/.env` 만들어야 실행 가능 |

**.env에 필요한 키**: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, PERPLEXITY_API_KEY
**키 위치**: `새 폴더/api.txt`

---

## UltraProduct 에이전트 지식 통합 (2026-03-26)

| 에이전트 | 주입된 지식 | 상태 |
|----------|------------|------|
| CDO | UX 원칙, 화면별 설계, 비주얼 디자인, 전환 최적화, 채널→디자인 | ✅ 완료 |
| 수아(마케팅) | 세일즈 퍼널, 가치 사다리, Hook-Story-Offer, PAS, 방문자 온도 | ✅ 완료 |
| /work 플로우 | Wave 1에 수아 채널 사전 판단 추가 | ✅ 완료 |

---

## 프로젝트별 상태

| 프로젝트 | 코드 | 배포 | 마지막 작업 |
|----------|------|------|-------------|
| 마케터_고객_플랫폼 (채팅+매칭 통합) | ✅ 있음 | ❌ 미배포 | 2026-03-24 |
| 소상공인_영업툴 (진단+연락처 통합) | ✅ 있음 | ❌ 미배포 | 2026-03-24 |
| 지역_소상공인_010번호+인스타 수집 툴 | ✅ 완료 | ❌ 미배포 | 2026-03-24 |
| 인스타 자동화 | ✅ 있음 | ❌ 미배포 | - |
| 포천 영업타겟 발굴 | ✅ 있음 | ❌ 미배포 | - |
| 네이버 플레이스 자동 진단 PPT | ✅ Wave 3 QA PASS | ❌ 미배포 | 2026-03-26 |

---

## Git 상태

| 항목 | 상태 |
|------|------|
| Git 초기화 | ✅ 완료 |
| 자동 커밋 hook | ✅ 작동 중 (Edit/Write 시 자동 커밋+push) |
| GitHub 원격 | ✅ 연결됨 (https://github.com/lian1803/LianCP.git) |
| 자동 push | ✅ 작동 중 |

---

## 최근 변경 이력

| 날짜 | 변경 내용 | 파일 |
|------|----------|------|
| 2026-03-26 | CTO 통합 리뷰 — 치명 버그 4개 + 중간 2개 수정 | main.py, routers/crawl.py, routers/batch.py |
| 2026-03-26 | /history, /batch 페이지 라우터 추가 | main.py |
| 2026-03-26 | messages 구조 변환 + sales_priority 동적 속성 | main.py |
| 2026-03-26 | crawl.py 경쟁사 크롤링/우선순위/메시지 통합 | routers/crawl.py |
| 2026-03-26 | CTO 리뷰 결과 저장 | qa/cto_review.md |
| 2026-03-26 | 영업툴 Wave 3 QA 검증 완료 (조건부 통과, 버그 2건 수정) | naver-diagnosis/ + qa/ |
| 2026-03-26 | CDO 에이전트 UX/비주얼/전환 업그레이드 | .claude/agents/cdo.md |
| 2026-03-26 | 수아 마케팅 퍼널/PAS/Hook 업그레이드 | .claude/agents/marketing.md |
| 2026-03-26 | /work Wave 1 순서 변경 | .claude/commands/work.md |
| 2026-03-26 | 종범 시장 리서치 포함 | lian_company/agents/jongbum.py |
| 2026-03-26 | 루트 CLAUDE.md 전면 업데이트 | CLAUDE.md |
| 2026-03-26 | 영업툴 백엔드 업그레이드 (메시지/배치/경쟁사/PPT9슬라이드) | naver-diagnosis/ |
| 2026-03-25 | 네이버 진단 PPT QA PASS | projects/번호로 자동으로 분석까지/ |

---

## 다음에 해야 할 것

- [ ] lian_company/.env 생성 후 파이프라인 테스트
- [ ] GitHub 레포 생성 → URL → 자동 push 연결
- [ ] 전체 E2E 테스트 (python main.py → /work)
- [ ] 각 프로젝트 배포 순서 결정

## 소상공인 수집툴 — 나중에 추가할 것

- [ ] 공공데이터포털 (data.go.kr) API — 이미 가입함
- [ ] 배달의민족 — 음식점 010번호
- [ ] 야놀자/여기어때 — 숙박업체

## 영업 문서 현황

| 파일 | 위치 |
|------|------|
| 영업_플레이북.md | projects/소상공인_영업툴/ |
| 영업_스크립트.md | projects/소상공인_영업툴/ |
