# 진행 상태

> Claude Code 켤 때마다 여기부터 확인. 마지막 업데이트: 2026-03-26

---

## 마지막 세션 (2026-03-26 저녁)

**뭘 했나 (2026-03-26 저녁 세션):**
소상공인 영업툴 백엔드 업그레이드 전체 구현 완료.

신규 생성:
- `config/industry_weights.py` — 업종별 가중치/객단가/경쟁사폴백/패키지 정의
- `config/__init__.py`
- `services/message_generator.py` — 1~4차 영업 메시지 자동 생성 (A/B/C 자동 선택)
- `services/competitor.py` — 경쟁사 경량 크롤링 + 업종별 폴백
- `services/batch_processor.py` — xlsx 배치 처리 (openpyxl, 3초 딜레이)
- `routers/message.py` — GET /message/{id}, POST /message/regenerate/{id}, PATCH /api/businesses/{id}/priority
- `routers/batch.py` — POST /batch/start, GET /batch/status/{id}, POST /batch/cancel/{id}, GET /batch/list

기존 수정:
- `services/scorer.py` — 업종별 가중치 자동 적용, 새소식패널티, 답글률, 경쟁사 상대점수
- `services/ppt_generator.py` — 표지 충격 문구, 경쟁사 비교 슬라이드, 손익분기 슬라이드, 개선 슬라이드 "비어있는 항목" 형식으로 변경 (7→9슬라이드)
- `models.py` — DiagnosisHistory 신규 컬럼 6개 추가 + BusinessPriority 모델 신규
- `routers/__init__.py` — message_router, batch_router 등록
- `main.py` — 신규 라우터 2개 등록
- `requirements.txt` — openpyxl==3.1.2 추가

**다음 세션에서 이어할 것:**
- [ ] DB_RESET=true로 서버 재시작해서 새 컬럼 반영 확인
- [ ] pip install openpyxl 실행
- [ ] 메시지 생성 API 테스트 (기존 diagnosis 기록으로 /message/{id} 호출)
- [ ] 포천/의정부 main_final.py로 실행 (양주만 해봄)
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
| 네이버 플레이스 자동 진단 PPT | ✅ 백엔드 업그레이드 완료 | ❌ 미배포 | 2026-03-26 |

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
