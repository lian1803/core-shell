# 진행 상태

> Claude Code 켤 때마다 여기부터 확인. 마지막 업데이트: 2026-04-02 (naver-diagnosis 배치 테스트 + 메시지 버그 대거 수정)

---

## 2026-04-02 naver-diagnosis 배치 테스트 + 메시지 대규모 버그 수정

**작업 내용**: 10개 양주 미용실 배치 진단 실행 + 발견된 버그 전부 수정

### 수정된 버그
| 버그 | 수정 |
|------|------|
| `estimated_lost_customers = 0` 하드코딩 (batch.py line 96) | `DiagnosisScorer.calculate_estimated_lost_customers()` 실제 계산으로 교체 |
| "사장님 사장님" — business_name 없을 때 폴백 | batch.py에 business_name 폴백 추가 |
| review_count=0 (실제 리뷰 수 사용 안 함) | `_build_diagnosis_dict`에서 `visitor_review_count + receipt_review_count` 사용 |
| 검색량 fallback 500 → 2000 | `_get_total_search_volume` 최솟값 수정 |
| "비싸다" 응답에 "1개월만 해보시고" | 3개월 약정 설명 + 무상연장으로 교체 |
| bookmark_count=0이 항상 타입C 유발 | 실제 수집 데이터 기준으로만 트리거 (사진<5장, 새소식 90일+) |
| 내 리뷰 > 경쟁사 평균인데 타입A 선택 | 내 리뷰 ≤ 경쟁사일 때만 타입A, 초과면 타입C |
| "소리헤어은" 조사 오류 | `_eun_neun()` 함수 추가 |
| "네이버에서  찾는 분들" 공백 두 개 | category 없을 때 빈칸 제거 |

### 배치 테스트 결과 (양주 미용실 10개)
- 10개 전부 성공 (실패 0)
- D등급 4개 / C등급 2개 / B등급 4개
- 타입A (리뷰격차): 소리헤어(30명), 더예쁨헤어(35명), 미광헤어(25명)
- 타입C (사진부족): 더이쁜머리, 헤어코코, 차헤어, 살롱레브양주점
- 타입C (정보미완성): 포에트리헤어, 유어살롱, 이선주헤어톡

### 다음 할 것
- 레퍼런스 클라이언트 확보 대기 중 (memory/project_offline_sales_pending.md 참조)
- 지인 답변 오면 "답변 왔어" 메시지 → Before/After 플로우 진행
- validator.py max_tokens=2000 → 4000으로 올리기 (출력이 잘림)
- Kakao Pay 비즈니스 계정 세팅 (리안 직접 해야 함)

---

## 2026-04-02 시스템 업그레이드 Phase 1+2 완료

**작업 내용**: 리안 시스템 5대 업그레이드 중 Phase 1+2 구현

### Phase 1 완료
**#2 Research-First 프로토콜** — FE/BE/QA 에이전트 코드 막히면 GitHub/Reddit 검색 먼저
- `.claude/agents/fe.md` — Research-First 섹션 추가
- `.claude/agents/be.md` — Research-First 섹션 추가
- `.claude/agents/qa.md` — Research-First 섹션 추가

**#3 개별 직원 호출** — "서윤아 조사해줘" 식으로 직원 단독 호출 가능
- `lian_company/ask.py` 신규 생성 (이사팀 6명 개별 호출)
- `OPERATIONS.md` — 1-G 섹션 추가 (이름 매핑 테이블)

### Phase 2 완료
**#5a 업무 기억** — 직원이 매 업무 후 경험 기록, 다음 업무 시 자동 로드
- `lian_company/knowledge/agent_memory.py` 신규 생성
- ask.py에 메모리 연동 (업무 시작/완료 시 자동 기록)
- CTO/CDO/FE/BE/QA `.md`에 업무 기억 섹션 추가

**#5c 성과 시스템** — 직원별 업무 횟수, 피드백 점수, 평균 평점 추적
- `knowledge/performance/` 디렉토리 자동 생성
- `ask.py --performance` — 전체 직원 성과 현황 조회
- `ask.py --feedback "이름" "점수" "내용"` — 리안이 직접 피드백 입력

### 다음 할 것
- 전체 5개 업그레이드 완료. 실제 프로젝트에서 사용하며 테스트.
- 온라인 마케팅팀 교육팀으로 생성 (`build_team.py`)
- naver-diagnosis 실제 서버 테스트

**변경된 파일 (Phase 1+2+3+4 전체):**
| 파일 | 변경 |
|------|------|
| `lian_company/ask.py` | 신규 생성 (개별 호출 + 피드백 + 성과 + 자기 개발) |
| `lian_company/knowledge/agent_memory.py` | 신규 생성 (경험/피드백/성과/자기 개발 전체) |
| `.claude/agents/fe.md` | Research-First + 업무 기억 |
| `.claude/agents/be.md` | Research-First + 업무 기억 |
| `.claude/agents/qa.md` | Research-First + 업무 기억 |
| `.claude/agents/cto.md` | Research-First + 업무 기억 |
| `.claude/agents/cdo.md` | 업무 기억 |
| `.claude/agents/architect.md` | 신규 생성 (도현, 시스템 아키텍트) |
| `.claude/agents/devops.md` | 신규 생성 (Wave 3.5 도구 수집가) |
| `.claude/commands/shell.md` | Wave 3.5 DevOps 추가 |
| `.claude/commands/work.md` | Wave 3.5 DevOps 추가 |
| `CLAUDE.md` | 직원 성장 + 도현 아키텍트 규칙 추가 |
| `OPERATIONS.md` | 1-G 직원 개별 호출 + 1-H 아키텍트 + 성장 명령어 |

---

## 2026-04-01 naver-diagnosis 점수/메시지 전면 업그레이드

**작업 내용**: 점수 로직 + 영업 메시지 + 업종 감지 전면 업그레이드 + 버그 수정

**주요 변경:**
| 파일 | 내용 |
|------|------|
| `services/scorer.py` | `estimated_lost_customers` 자동 계산 추가, 경쟁사 상대 점수 보너스/패널티 |
| `services/message_generator.py` | 1~4차 메시지 전면 재작성 (충격 숫자 주입, SMS 생성, 손익분기, 4가지 상황 대응) |
| `config/industry_weights.py` | 업종 감지 키워드 3배 확장, 병원/안경 업종 신설, 패키지 추천 로직 수정 |
| `main.py` | `_build_template_messages()` sms_text 전달 버그 수정 |

**패키지 추천 로직:**
- D등급 → 집중(49만원) (진입장벽 낮게)
- C등급 + SNS 약점 → 시선(89만원)
- C등급 기본 → 집중
- B등급, 취약 3개 미만 → 주목(29만원)

**테스트 결과 (양주 미용실, 리뷰 12개, 순위 13위):**
- 총점 34.8점 / D등급 / 추정 손실 7명/월
- 1차 메시지: 리뷰 격차형 자동 선택
- 추천 패키지: 집중 ✓

---

## 2026-04-01 naver-diagnosis 버그 수정 완료

**작업 내용**: 이전 세션 이어서 — batch/crawl/ppt/message 라우터 전체 통합 버그 수정

**수정된 버그 목록**:
| 버그 | 파일 | 수정 내용 |
|------|------|---------|
| batch.js `data.total_count` 오타 | `static/js/batch.js` | `data.total_count` → `data.total` |
| batch.js 파일 업로드 엔드포인트 불일치 | `static/js/batch.js` | `/batch/start` → `/batch/upload` |
| 배치 파일 업로드 엔드포인트 없음 | `routers/batch.py` | `/batch/upload` (multipart) 신규 추가 |
| 배치 상태 필드명 불일치 | `routers/batch.py` | `completed`→`success`, `done`→`completed`, `processed` 계산, `last_processed` 추가 |
| `delay_seconds` 존재하지 않는 파라미터 | `routers/batch.py` | `delay_seconds=3` → `delay_min=3, delay_max=6` |
| PPT 재생성 시 신규 필드 누락 | `routers/ppt.py` | `competitor_avg_*`, `estimated_lost_customers`, `related_keywords`, 모든 `has_*` 필드 추가 |
| 경쟁사 폴백 시 `competitor_avg_photo` 미설정 | `routers/crawl.py` | `competitor_avg_photo = fb["avg_photo"]` 추가 |
| result 페이지 메시지 재생성 시 `competitor_avg_photo` 하드코딩 0 | `main.py` | `history.competitor_avg_photo or 0` 로 수정 |

**변경된 파일**:
- `team/[진행중] 오프라인 마케팅/소상공인_영업툴/naver-diagnosis/static/js/batch.js`
- `team/[진행중] 오프라인 마케팅/소상공인_영업툴/naver-diagnosis/routers/batch.py`
- `team/[진행중] 오프라인 마케팅/소상공인_영업툴/naver-diagnosis/routers/ppt.py`
- `team/[진행중] 오프라인 마케팅/소상공인_영업툴/naver-diagnosis/routers/crawl.py`
- `team/[진행중] 오프라인 마케팅/소상공인_영업툴/naver-diagnosis/main.py`

**이전 세션에서 수정된 버그** (crawl.py, message_tabs.js):
- `naver_place_rank` 하드코딩 0 수정
- `place_id` 미전파 수정
- `competitor_avg_photo` DB 저장 누락 수정
- 업체명만으로 검색 → 주소+업체명 검색으로 수정
- priority 드롭다운 값 불일치 수정 (`'1'` → `'1순위'`)
- `/batch/stop/` → `/batch/cancel/` 수정

**다음에 할 것**:
1. 실제 서버 실행 테스트 (`uvicorn main:app --reload`)
2. 업체 1~2개 테스트 크롤링으로 전체 파이프라인 확인
3. GitHub 원격 연결 (lian_company 기준)

---

## 2026-03-31 강의 자료 knowledge/base + 에이전트 주입 완료

**작업 내용**: 자료들/12/ 폴더 HTML 7개 → Gemini 2.5 Flash로 추출 → knowledge/base + 에이전트 SYSTEM_PROMPT 주입 후 원본 삭제

**변경된 파일**:
| 파일 | 변경 내용 |
|------|---------|
| `knowledge/base/AI기초_비즈니스활용.md` | Part1 전체 추출 (50KB) |
| `knowledge/base/AI툴심화_자기강화루프.md` | Part2 전체 추출 (57KB) |
| `knowledge/base/서비스기획_원칙_완전판.md` | Part3 전체 추출 (54KB) |
| `knowledge/base/UX_설계원칙_완전판.md` | Part4 전체 추출 (15KB) |
| `knowledge/base/프로토타이핑_IA_UJ_PRD_가이드.md` | Part5 전체 추출 (23KB) |
| `knowledge/base/린스타트업_방법론_완전판.md` | Part6 전체 추출 (18KB) |
| `knowledge/base/마케팅퍼널_완전가이드.md` | 마케팅 설계자 전체 추출 (25KB) |
| `.claude/agents/cpo.md` | Part3(서비스기획) + Part5(프로토타이핑) 섹션 추가 |
| `.claude/agents/pm.md` | Part3(서비스기획) 섹션 추가 |
| `.claude/agents/cdo.md` | Part4(UX설계) 섹션 추가 |
| `.claude/agents/fe.md` | Part4(UX설계) 섹션 추가 |
| `.claude/agents/marketing.md` | 마케팅퍼널 섹션 추가 |
| `agents/sieun.py` | Part6(린스타트업_적용원칙) SYSTEM_PROMPT 주입 |
| `agents/minsu.py` | Part6(전략수립_린캔버스) SYSTEM_PROMPT 주입 |
| `agents/junhyeok.py` | Part6(GO판단_린스타트업) SYSTEM_PROMPT 주입 |
| `teams/offline_marketing/copywriter.py` | 마케팅퍼널_카피라이팅_원칙 SYSTEM_PROMPT 주입 |
| `자료들/12/*.html` | 원본 7개 삭제 완료 |

**분석팀 신설 (이전 세션)**:
- `teams/analysis/analyzer.py` — Gemini 2.5 Flash 비전 (이미지/영상)
- `teams/analysis/pipeline.py` — 독립 실행 스캐너
- `process_inbox.py` — 이미지/영상 분석팀 연동 완료

**다음에 할 것**:
1. main.py 파이프라인 end-to-end 테스트
2. GitHub 원격 연결
3. Phase 2: --discover 모드 (Pain 발굴, 자동 트렌드 수집)

---

## 2026-03-31 회사 전면 개편 완료

**작업 내용**: 이사팀 재설계 + 교육팀 신설 + 오프라인 마케팅팀 신설 + 조직도 + 지식 관리 시스템

**변경된 파일**:
| 파일 | 변경 내용 |
|------|---------|
| `lian_company/agents/sieun.py` | interview_for_team(), design_team() 추가 (팀 설계 기능) |
| `lian_company/core/pipeline.py` | 지훈/종범/수아 제거, 시은 인터뷰(step 6) + 팀 설계(step 7) + 교육팀(step 8) 추가 |
| `lian_company/teams/education/` | 교육팀 신설 (curriculum_designer, trainer, team_generator, pipeline) |
| `lian_company/teams/offline_marketing/` | 오프라인 마케팅팀 신설 (researcher/재원, strategist/승현, copywriter/예진) |
| `lian_company/build_team.py` | 교육팀 실행 진입점 |
| `lian_company/offline_sales.py` | 오프라인 마케팅팀 진입점 |
| `lian_company/knowledge/manager.py` | 지식 관리 시스템 (저장/검색/피드백/공유) |
| `lian_company/knowledge/index.json` | 지식 인덱스 (태그 기반) |
| `회사 조직도.md` | 전 직원 조직도 신설 (팀 신설 시 자동 업데이트) |
| `CLAUDE.md` | 전체 플로우/폴더구조/에이전트 지식체계 현행화 |
| `가장 먼저 해야할거.md` | 최상위 방향성 추가 + 구현 상태 업데이트 + 새 폴더 마이그레이션 태스크 |

**핵심 변경사항**:
1. **지훈/종범/수아 해고** → 프로젝트별 전문 에이전트로 대체
2. **교육팀**: Opus가 커리큘럼 설계 → Perplexity가 지식 수집 → 팀 파일 자동 생성
3. **2단계 인터뷰**: 시은(큰 그림, 이사팀) + 팀별 디테일 인터뷰
4. **지식 누적 루프**: 결과물 자동 저장 → 리안 피드백 → 다음 실행 시 반영
5. **조직도 자동 업데이트**: 팀 신설 시 회사 조직도.md 자동 반영

**해결한 이슈**:
- UnicodeEncodeError (knowledge/manager.py emoji → 텍스트 괄호로 교체)
- team_generator.py PIPELINE_TEMPLATE {team_slug} 플레이스홀더 누락 수정

**다음에 할 것**:
1. 새 폴더/ 강의 자료 → knowledge/base/ 마이그레이션 (CDO/수아/종범 해고로 지식 단절됨)
2. inbox 분석기 구현 (qwen3-vl 로컬 비전모델 — 리안이 스크린샷 던지면 자동 분석)
3. 자동 트렌드 수집 (태호 주기적 실행)
4. Playwright 브라우저 자동화 (CDP 방식)
5. main.py 파이프라인 테스트 (end-to-end)

---

## 2026-03-31 UI 품질 개선 + 파이프라인 최적화 완료

**작업 내용**: LIANCP 파이프라인 오류 수정, 속도 개선, UI 품질 업그레이드

**변경된 파일**:
| 파일 | 변경 내용 |
|------|---------|
| `lian_company/.env` | ANTHROPIC_API_KEY 새 키 적용 |
| `lian_company/agents/sieun.py` | interactive 파라미터 추가 (CLI 모드에서 input() 스킵) |
| `lian_company/agents/taeho.py` | MiniMax→Claude Haiku 폴백 구조 추가, 60s 타임아웃 |
| `lian_company/agents/seoyun.py` | 90s 타임아웃 추가 |
| `lian_company/core/discussion.py` | 90s 타임아웃, MAX_ROUNDS 2→1, max_tokens 800→500 |
| `lian_company/core/pipeline.py` | 전 에이전트 try/except 추가, 태호+서윤/종범+수아 병렬화 |
| `lian_company/main.py` | interactive 파라미터 전달 |
| `lian_company/verify_gemini.py` | 모델명 수정 (gemini-2.5-pro-preview-03-25) |
| `lian_company/agents/jongbum.py` | 디자인 방향 섹션 추가 (CDO 전달용) |
| `.claude/commands/work.md` | Agent 병렬화, wave summary 파일, Gemini 모델명 수정 |
| `.claude/agents/cdo.md` | /theme-factory + /brand-guidelines 작업 순서 추가, Aceternity/Magic UI 추가 |
| `.claude/agents/fe.md` | /frontend-design 스킬 + Aceternity/Magic UI 설치/사용 지침 추가 |

**핵심 개선사항**:
1. **안정성**: 에이전트 오류 시 전체 파이프라인 중단 방지 (try/except 전면 적용)
2. **속도**: 태호+서윤 병렬, 종범+수아 병렬 → 리안 컴퍼니 ~7분 단축
3. **UI 품질**: CDO가 /theme-factory + /brand-guidelines 호출, FE가 Aceternity UI + Magic UI 사용
4. **디자인 컨텍스트**: 종범이 생성하는 CLAUDE.md에 "디자인 방향" 섹션 자동 포함 → CDO에게 자동 전달
5. **work.md 병렬화**: Wave 1(CPO+CTO+수아채널), Wave 3(FE+BE), Wave 4(QA+CTO) Agent 병렬 실행

**다음에 할 것**:
- Anthropic 스킬 설치 (한 번만): `npx skills add` (frontend-design, theme-factory, brand-guidelines)
- 파이프라인 테스트: `cd lian_company && ./venv/Scripts/python.exe main.py "테스트 아이디어"`

---

## 2026-03-30 Lian Dash — CDO Wave 1 완료

**작업 내용**: Lian Dash UI 프로토타입 화면 설계 완료

**생성된 파일**:
| 경로 | 내용 |
|------|------|
| `projects/Lian_Dash/wave1_cdo.md` | CDO Wave 1 — 디자인 시스템/5개 화면 상세 레이아웃/컴포넌트 상태/반응형/FE 체크리스트 |

**설계 요약**:
- **디자인 비전**: "데이터를 보는 즐거움" — 선제적 AI 애널리틱스, Light mode 단독
- **컬러 팔레트**: Primary=Indigo, 채널별=GA4(Blue)/Meta(Purple)/네이버SA(Emerald), Semantic colors
- **타이포그래피**: Pretendard + Plus Jakarta Sans (KPI 숫자)
- **5개 화면 상세 레이아웃**: 랜딩(모바일 퍼스트) / 온보딩 3단계 / 대시보드 1280px / AI 인사이트 320px 슬라이드아웃 / PDF 내보내기 모달
- **컴포넌트**: KpiCard + TrendArrow / InsightCard(빨강/노랑/초록 border-left) / ConnectionCard / ChannelBadge / ShimmerSkeleton
- **KPI 카드**: 수치(₩38,080,000 포맷) + 전주 대비 % + 초록↑/빨강↓ 화살표
- **반응형**: 랜딩/온보딩 모바일 퍼스트, 대시보드 데스크탑 우선 (1024px 사이드바 숨김)
- **애니메이션**: 날짜 필터 스켈레톤 / AI 패널 slide-in 300ms / 온보딩 순차 로딩 1.5s
- **FE 체크리스트**: CDO-FE-01~16까지 구현 항목 정리

**다음 단계**:
1. FE Wave 3 — 실제 코드 구현 (`src/` 폴더 전체)
2. PM Wave 2 — 크로스 토론 + 개발 계획

---

## 2026-03-30 AI 기반 동적 가격 결정 SaaS — Frontend Wave 3 완료

**작업 내용**: wave1_cdo.md + wave2_pm_계획.md 기반 Next.js 14 Frontend 전체 구현

**생성된 파일 (신규)**:
| 경로 | 내용 |
|------|------|
| `src/types/index.ts` | 전체 TypeScript 타입 정의 |
| `src/lib/api.ts` | 백엔드 API 클라이언트 (모든 엔드포인트) |
| `src/lib/utils.ts` | 공통 유틸 (formatCurrency, debounce, easeOut 등) |
| `src/store/useAuthStore.ts` | Zustand 인증 상태 |
| `src/store/useOnboardingStore.ts` | Zustand 온보딩 상태 |
| `src/store/useSimulatorStore.ts` | Zustand 시뮬레이터 상태 |
| `src/store/useAiStore.ts` | Zustand AI 추천 상태 |
| `src/app/layout.tsx` | 루트 레이아웃 (Inter 폰트, Sonner 토스트) |
| `src/app/globals.css` | Tailwind + CDO 디자인 시스템 |
| `src/app/(auth)/login/page.tsx` | 화면 1: 2분할 로그인 (Google + 이메일) |
| `src/app/(auth)/register/page.tsx` | 회원가입 페이지 |
| `src/app/(dashboard)/layout.tsx` | 사이드바 + 모바일 헤더 레이아웃 |
| `src/app/(dashboard)/dashboard/page.tsx` | 화면 3: KPI 카드 + ARR 차트 + 이력 테이블 |
| `src/app/(dashboard)/onboarding/page.tsx` | 화면 2: 4단계 온보딩 마법사 |
| `src/app/(dashboard)/simulator/page.tsx` | 화면 4: 2열 가격 시뮬레이터 + 실시간 차트 |
| `src/app/(dashboard)/ai-recommendations/page.tsx` | 화면 5: AI 추천 + 근거 Accordion + 로드맵 |
| `src/app/(dashboard)/ab-comparison/page.tsx` | 화면 6: A/B 비교 + 통합 차트 |
| `src/app/(dashboard)/export/page.tsx` | 화면 7: 리포트 미리보기 + PDF/CSV 내보내기 |
| `src/app/(dashboard)/monitoring/page.tsx` | 화면 8: 실시간 지표 + 알림 설정 |
| `src/app/(dashboard)/team/page.tsx` | 팀 관리 (초대 + 권한) |
| `src/app/(dashboard)/settings/page.tsx` | 설정 (프로필 + Stripe + 알림) |
| `src/components/layout/Sidebar.tsx` | 화면 9: 240px 사이드바 (다크) |
| `src/components/layout/MobileHeader.tsx` | 모바일 Sheet 헤더 |
| `src/components/dashboard/KpiCard.tsx` | KPI 카드 (카운트업 애니메이션) |
| `src/components/dashboard/ArrChart.tsx` | ARR 라인/에리어 차트 (Recharts) |
| `src/components/dashboard/SimulationHistoryTable.tsx` | 시뮬레이션 이력 테이블 |
| `src/components/simulator/PriceSliderGroup.tsx` | 모델별 슬라이더 그룹 (Per-Seat/Usage/Flat) |
| `src/components/simulator/ScenarioChart.tsx` | 시나리오 비교 차트 + 손익분기선 |
| `src/components/ai/AiRecommendationCard.tsx` | AI 추천 Hero + Accordion + Stepper |
| `src/components/ui/*.tsx` | shadcn/ui 12개 컴포넌트 수동 구현 |
| `tailwind.config.ts` | CDO 컬러 팔레트 반영 |
| `tsconfig.json` | TypeScript 설정 (@/* alias) |
| `postcss.config.js` | PostCSS 설정 |
| `components.json` | shadcn/ui 설정 |
| `package.json` | FE 의존성 추가 (zustand, recharts, sonner 등) |

**구현 범위 (PM FE 27개 Task 대응)**:
- FE-01~07: 인증 + 온보딩 4단계 완료
- FE-08~15: 대시보드 + 시뮬레이터 완료
- FE-16~22: AI 추천 + A/B 비교 + 리포트 + 팀 관리 완료
- FE-23~27: 모바일 반응형 + 스켈레톤 + 빈 상태 + 에러 fallback 완료

**다음 단계**:
1. `npm install` 실행 (프로젝트 루트에서)
2. `.env.local` 파일 생성 (.env.example 복사)
3. `npm run dev` 실행 → http://localhost:3000
4. BE API 연결 후 demo 데이터 → 실제 데이터 전환

---

## ✅ 2026-03-30 리안 컴퍼니 자동화 완성 (테마 2/3/5 + 디스코드)

**완성 항목**:

### 1. 테마 2 — 실행 자동화 (Cloudflare 배포)
- `lian_company/core/deployer.py` — wrangler CLI 래퍼
- pipeline.py에 통합: `deploy(project_dir, dry_run=True)` 호출
- 환경변수: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CF_PROJECT_NAME

### 2. 테마 3 — 24/7 모니터링 크론 (sentinel/mijeong/doctor)
- `lian_company/cron/scheduler.py` — 메인 스케줄러 (schedule 라이브러리)
- `lian_company/cron/sentinel.py` — 30분마다 PROJECT_URL 헬스체크
- `lian_company/cron/mijeong.py` — 매일 08:00 일일 보고 (Claude Haiku)
- `lian_company/cron/doctor.py` — 이상 감지 시 Claude로 수정 분석
- `lian_company/cron/notify.py` — 크론 전용 디스코드 래퍼

### 3. 테마 5 — 리안의 입력 최소화
제거된 input() 호출:
- ~~"이사팀 실행할까?"~~ → main.py에서 자동 진행
- ~~"실행팀 진행할까?"~~ → pipeline.py에서 CONDITIONAL_GO 시만 wait_confirm()
- ~~PRD 피드백 루프~~ → 1회 자동 ok (while루프 제거)
- ~~마케팅 피드백 루프~~ → 1회 자동 ok (while루프 제거)

**유지된 입력** (2곳):
1. ✅ 시은: "예상 방향 맞아?" — 터미널 방향 확인
2. ✅ 준혁 CONDITIONAL_GO: 디스코드 알림 + 터미널 y/n

### 4. 추가: 디스코드 실시간 알림
- `lian_company/core/notifier.py` — 핵심 디스코드 웹훅 통합
- 각 에이전트 완료 후 실시간 알림: 태호→서윤→민수→하은→준혁→지훈→종범→수아
- 파이프라인 시작/완료/에러 알림
- wait_confirm() — 디스코드 메시지 전송 후 터미널에서 y/n 입력

**환경변수 추가**:
- DISCORD_WEBHOOK_URL
- PROJECT_URL (크론 헬스체크 대상)

**파일 변경 정리**:
| 파일 | 변경 |
|------|------|
| `lian_company/main.py` | "이사팀 실행할까?" input() 제거, notify_pipeline_start() 추가 |
| `lian_company/core/pipeline.py` | 4개 input() 제거/축소, 각 에이전트 완료 후 notify, deployer 통합 |
| `lian_company/.env.example` | 4개 환경변수 추가 (디스코드, Cloudflare, 크론) |
| `lian_company/core/notifier.py` | **신규** |
| `lian_company/core/deployer.py` | **신규** |
| `lian_company/cron/__init__.py` | **신규** |
| `lian_company/cron/scheduler.py` | **신규** |
| `lian_company/cron/sentinel.py` | **신규** |
| `lian_company/cron/mijeong.py` | **신규** |
| `lian_company/cron/doctor.py` | **신규** |
| `lian_company/cron/notify.py` | **신규** |

**다음 단계**:
1. `.env` 파일 생성 후 API 키/토큰 입력
2. `python main.py "테스트아이디어"` 실행 → 디스코드 채널 확인
3. CONDITIONAL_GO 시 터미널 y/n 컨펌 작동 확인
4. `pythonw lian_company/cron/scheduler.py` 백그라운드 실행 → 30분 후 sentinel 체크

---

## ✅ 2026-03-30 Wave 1 CDO 화면 설계 완료

**작성 항목**: wave1_cdo.md (소상공인 카카오톡 자동 응대 챗봇 빌더)

**포함 내용**:
- 디자인 비전 ("5분 안에 쓸 수 있는 챗봇")
- 5가지 핵심 UX 원칙 (Progressive Disclosure, Context-Aware, Clear CTA, Feedback, Mobile First)
- 8단계 온보딩 플로우 (Step 0~7 + 액션 카운트 검증)
- 정교한 컬러 시스템 (Yellow #FFE812 + Blue #4B9FE1 + Green + Red)
- 타이포그래피 (Pretendard, 28px~12px, 명확한 계층)
- 8개 화면 상세 설계 (Step 0: 랜딩 ~ Step 8: 대시보드)
- 마이크로 인터랙션 & 애니메이션 (폼 피드백, 화면 전환, 성공 표현)
- 모바일 최적화 (44px 버튼, 320px~768px 반응형)
- 컴포넌트 목록 (shadcn/ui 기본 + 커스텀)
- FE 구현 가이드 (CDO 준수 규칙)
- 성공 지표 (70% 완료율, 7분 완성, 0 비용 이탈)

**준혁 조건 반영**:
1. ✅ MVP 범위 준수 (노코드 편집만)
2. ✅ 비용 팝업 필수 (Step 2.5, 체크박스 필수)
3. ✅ 5분 완성 검증 (액션 10회 이내, 시간 로깅)
4. ✅ 명확한 화면별 설계 (네이버 블로그 가독성 최우선)

**CDO 최종 판단**: **GO**
- 조건: FE가 CDO 설계 정확히 구현 (색상, 타이포, 애니메이션)
- 검증: Wave 3 완료 후 QA에서 CDO 준수 여부 검증

**다음 단계**: Wave 2 PM 계획 + Wave 3 FE/BE 코드 작성

---

## ✅ 2026-03-30 Wave 1 CTO 기술 설계 완료

**작성 항목**: wave1_cto.md (소상공인 카카오톡 자동 응대 챗봇 빌더)

**포함 내용**:
- Cloudflare 스택 아키텍처 (Pages + Workers + D1 + R2 + Queues)
- 카카오 API 격리 모듈 설계 (정책 변경 1~2일 대응)
- 데이터 모델 (6개 테이블: users, chatbots, templates, responses, messages, analytics)
- API 엔드포인트 (15개: 인증 3개, 온보딩 4개, 챗봇 관리 4개, 대시보드 2개, 웹훅 1개, 관리 1개)
- 온보딩 플로우 (액션 10회, 7분 목표, 시간 로깅)
- 보안 설계 (HTTPS, CSRF, Rate Limiting, 토큰 암호화, 비밀번호 해싱)
- 성능 요구사항 (API 응답 < 500ms, 동시 100명 수용)
- 기술 리스크 및 대응책 (NextAuth.js 호환성, SQLite 성능, 카카오 정책 변경)
- 배포 블로커 체크리스트 (Cloudflare 계정, D1 생성, 카카오 OAuth 테스트)

**준혁 조건 반영**:
1. ✅ MVP 범위 강제 (AI 개인화/ROI 대시보드 제외)
2. ✅ 비용 팝업 필수 (온보딩 Step 3)
3. ✅ 5분 완성 검증 (액션 10회 이내, 시간 로깅)
4. ✅ 카카오 API 격리 모듈 (services/kakao/ 폴더만 수정)

**최종 판단**: **CONDITIONAL_GO**
- 전제 1: Cloudflare Workers 계정 + D1 생성 (리안 담당)
- 전제 2: 카카오 OAuth 손수 테스트 (리안 담당)
- 전제 3: Wave 2-3 코드 후 온보딩 실제 테스트 (7분 이내)
- 유효기간: 2026-04-15 (2주)

**다음 단계**: Wave 2 CDO 화면 설계 → Wave 3 FE/BE 코드

---

## ✅ 2026-03-30 Wave 1 CPO 분석 완료

**작성 항목**: wave1_cpo.md (소상공인 카카오톡 자동 응대 챗봇 빌더)

**포함 내용**:
- 제품 전략 (포지셔닝 + 핵심 메시지)
- MVP 범위 5가지 기능
- 가격 전략 (3단계 플랜 + LTV/CAC 분석)
- 배포 경로 (3개월 로드맵 + 월별 성장)
- 성공 기준 KPI (30일/90일 목표)
- 배포 블로커 체크리스트
- CTO 요청 (4대 필수 + 권장 구현)
- 리스크 & 기회 분석
- CPO 최종 판단 (GO, 제약 조건 있음)

**준혁 조건 반영**:
- MVP 범위 강제 준수 (AI 개인화/ROI 대시보드 제외)
- 카카오 메시지 비용 안내 팝업 필수 (온보딩 3단계)
- 5분 완성 검증 (액션 10회 이내, 로깅 필수)
- 카카오 API 격리 아키텍처

**다음 단계**: CTO Wave 1 기술 설계 실행 (wave1_cto.md)

---

## ✅ 2026-03-30 폴더 이름 변경 완료

- `LAINCP - 복사본` → `LIANCP` (이름 변경 완료)
- memory 복사 완료 (LAINCP → LIANCP memory 폴더)
- CLAUDE.md 경로 참조 LAINCP → LIANCP 수정 완료

### 이어서 할 것
- 디스코드 봇 설계 + 구현 (토론 중이었음)
- /work 자동 연결 (pipeline.py 마지막에 claude -p "/work" 추가)

---

## 2026-03-30 세션에서 한 것

**1. E2E 테스트 완료**
- `python main.py` 전체 파이프라인 완주 확인
- 이사팀(태호→서윤→민수→하은→토론→준혁) + 실행팀(지훈→종범→수아) 전부 작동
- 버그 수정: Windows 폴더명 콜론 오류, surrogate 유니코드 오류

**2. 시은 방향 확인 추가**
- 명확화 후 4줄 요약 보여줌 ("이 방향 맞아? [맞아/아니]")
- 틀리면 수정 받고 재요약
- 파일: `lian_company/agents/sieun.py`

**3. Cloudflare 스택으로 전환**
- Vercel → Cloudflare Pages
- Supabase → Cloudflare D1 + R2
- 백엔드 → Cloudflare Workers (Hono, TypeScript)
- 파일: `.claude/agents/cto.md`, `.claude/agents/be.md`, `.claude/commands/work.md`

**4. 아키텍처 토론 결론**
- 지금 구조(Python 이사팀 + Claude Code 개발팀) = 업계 정석 (CrewAI, AutoGen과 동일)
- Python 통합(A안) = 퀄 안 좋아짐, 할 필요 없음
- 디스코드 봇으로 자동화(B안) = 맞는 방향

**5. 디스코드 봇 설계 토론 (미완, 이어서 할 것)**

```
이사팀 (Python 직접 호출) → 디스코드 채널에 실시간 출력 ✅ 쉬움
개발팀 (Claude Code /work) → 두 가지 안:
  A) 봇이 claude -p "/work" 백그라운드 실행 후 결과만 전송
  B) 개발팀도 디스코드 캐릭터로 등장 (Claude API 직접 호출)
```

**추천: A안 먼저, 나중에 B안으로 업그레이드**

---

---

## 마지막 세션 (2026-03-29 — LAINCP 복사본 Phase 1 업그레이드 완료)

**뭘 했나 (2026-03-29 세션):**
인스타 10개 + 유튜브 14개 분석 → 5대 문제 도출 → 복사본에 Phase 1 전체 구현.

**핵심 변경 사항:**

1. **모델 최적화** — Opus 5회→1회 (비용 ~60% 절감)
   - junhyeok.py: Opus→Sonnet
   - CPO/CTO/BE 에이전트: Opus→Sonnet
   - CTO Wave 4 통합 리뷰만 Opus 유지 (전체 파이프라인 유일한 Opus 사용)

2. **품질 안전장치**
   - junhyeok.py: JSON 파싱 실패 기본값 GO→CONDITIONAL_GO (안전방향)
   - jihun.py: 하은 반론을 PRD 리스크 섹션에 강제 반영
   - temperature 전 에이전트 명시: 판단=0, 창의=0.7, 균형=0.3
   - haeun.py: JSON 구조 출력 (verdict + severity + critical_risks)

3. **토론 루프** — 민수↔하은 최대 2라운드
   - 신규: `lian_company/core/discussion.py` (DiscussionRoom 클래스)
   - pipeline.py: [4.5/9] 토론 루프 단계 추가
   - junhyeok.py: 토론 결과 transcript 참조

4. **CDO 레퍼런스 사냥** — Perplexity로 경쟁사 디자인 수집 후 설계
   - cdo.md: "레퍼런스 사냥" 섹션 추가 (작업 전 필수)

5. **FE CDO 준수** — CDO 설계 스펙 그대로 구현 강제
   - fe.md: "CDO 설계 준수 원칙" 섹션 추가

6. **QA 5항목 체크리스트**
   - qa.md: 단순 "Must Have 작동" → 5개 항목 표 (보안/에러/CDO/모바일 포함)

7. **work.md 업데이트**
   - Wave 3.5 린터 단계 추가 (ESLint + Ruff 자동 수정)
   - Wave 4 CTO 리뷰 Opus로 변경

8. **jongbum.py 업그레이드**
   - 준혁 조건/주의사항 → "구현 주의사항" 섹션으로 전달
   - 토론 transcript 참조 추가
   - temperature=0

**변경된 파일 (복사본):**
- `lian_company/agents/junhyeok.py` — 모델+기본값+토론참조+temperature
- `lian_company/agents/jihun.py` — 하은참조+temperature
- `lian_company/agents/haeun.py` — JSON출력+temperature
- `lian_company/agents/sieun.py` — temperature
- `lian_company/agents/minsu.py` — temperature
- `lian_company/agents/jongbum.py` — 준혁조건+토론참조+temperature
- `lian_company/core/discussion.py` — 신규 생성
- `lian_company/core/pipeline.py` — 토론루프 추가
- `.claude/agents/cdo.md` — 레퍼런스 사냥 섹션
- `.claude/agents/cto.md` — 모델 명시
- `.claude/agents/cpo.md` — 모델 명시
- `.claude/agents/be.md` — 모델 명시
- `.claude/agents/fe.md` — CDO 준수 원칙, 모델 업그레이드
- `.claude/agents/qa.md` — 5항목 체크리스트, 모델 업그레이드
- `.claude/commands/work.md` — Wave 3.5 린터, CTO Opus 명시

**다음에 할 것:**
- 복사본에서 E2E 테스트 (python main.py "테스트 아이디어")
- 테스트 통과하면 원본 LAINCP에 반영
- Phase 2: 텔레그램 봇 연동 (telegram_bot.py + notifier.py)

---

## 마지막 세션 (2026-03-29 — 인스타+유튜브 분석)

**뭘 했나 (2026-03-29 세션 前):**
- video_analyzer.py 생성 (Gemini로 영상/이미지 분석)
- 인스타 10개 폴더 분석 → `업그레이드 해야할거/_전체분석결과.md`
- 유튜브 14개 스크립트 분석 → `11/_유튜브분석결과.md`
- 심층 분석 → `_심층분석_종합.md` (5대 문제 + 해결 설계)

---

## 마지막 세션 (2026-03-28 — 팀플 Wave 1 CDO 분석 완료)

**뭘 했나 (2026-03-28 세션):**
항해 팀플 Voyage App Wave 1 CDO 분석 완료.
디자인 시스템 + 컴포넌트 목록 + 화면 레이아웃 + 애니메이션 설계 전체.

**CDO 주요 결정:**
- 컬러 팔레트: ocean-deep(#4B9FE1) / sand(#FFE4A0) / coral(#FF8A7A) / gold(#FFD95A)
- 팀원 아바타: 4색 고정 (파랑/노랑/코랄/보라) — created_at 순서로 자동 배정
- 배 7단계: 이모지 + CSS 조합 (이모지: 🪵→⛵→⛵→🚢→🚢→🚢→🏴‍☠️+🚢)
- 승선 애니메이션: 아바타 포물선 이동 (섬→배), Framer Motion 키프레임
- 출항 애니메이션: 배 곡선 이동 + ConfettiEffect (2.5초)
- 리텐션 트릭 8개: 미완성 루프, 스트릭 공개, AI 메시지 기대감 등

**신규 생성 파일:**
- `projects/[진행] 팀플/wave1_cdo.md` ← CDO 분석 완성본 (디자인 시스템 + 전체 화면 설계)

이전 세션 (2026-03-28 — PRD + CPO + CTO 분석):
- `projects/[진행] 팀플/PRD.md` ← 완전한 PRD
- `projects/[진행] 팀플/CLAUDE.md` ← 기술 스택 + 데이터 모델
- `projects/[진행] 팀플/wave1_cpo.md` ← CPO 분석
- `projects/[진행] 팀플/wave1_cto.md` ← CTO 분석

**다음 세션에서 이어할 것:**
- Wave 2: FE + BE 코드 작성 실행
- Supabase 프로젝트 생성 (URL/KEY 확보)
- Google OAuth 설정 (CLIENT_ID/SECRET 확보)
- `projects/[진행] 팀플/voyage-app/` 폴더에서 Next.js 프로젝트 생성

---

## 마지막 세션 (2026-03-27 — 소상공인 비대면 영업 가이드 최종본 완성)

**뭘 했나 (2026-03-27 세션):**
소상공인 영업툴 — 방문 미팅 중심에서 비대면(카카오/문자) 클로징 중심으로 전략 전환.
UltraProduct CPO + 마케팅(수아) 에이전트 Wave 1 실행 후, 리안 컨펌 받아 최종 가이드 완성.

**결정 사항:**
- 패키지: 주목 29만 / 집중 49만 / 시선 89만 (월, 최저 할인가, 3개월 이상 계약)
- 패키지 나열 순서: 89→49→29 (앵커링)
- 비대면 메인: 집중 플랜 49만원 중심
- 하루 발송: 50건, 오전 10시 고정
- 계약: 무조건 3개월 이상 (월 단위 없음)
- 1차 메시지 D형(경쟁사 움직임형) 추가
- PPT는 2차에서 안 보냄, 3차 이후 이미지 3장만
- CTA: 이중선택형 ("집중이랑 주목 중 어떤 게 맞으세요?")
- 4차 이후: 2주/1개월/2개월 장기 nurturing

**신규 생성 파일:**
- `projects/[진행중] 오프라인 마케팅/소상공인_영업툴/영업_실전가이드_최종.md` ← 지금 쓸 수 있는 완성본
- `projects/[진행중] 오프라인 마케팅/소상공인_영업툴/wave1_cpo_영업퍼널_재설계.md`
- `projects/[진행중] 오프라인 마케팅/소상공인_영업툴/marketing/비대면_퍼널_전환최적화.md`

**다음 세션에서 이어할 것:**
- 글로싸인 계약서 템플릿 만들기 (비대면 서명용)
- 카카오페이 송금 링크 세팅
- 영업 트래킹 구글시트 만들기 (업체명/단계/날짜/메모)
- 원한다면 진단 툴에 메시지 자동 생성 기능 추가 (복붙만 하면 되게)

---

## 마지막 세션 (2026-03-26 — Wave 5 마케팅 전략 완료)

**뭘 했나 (2026-03-26 세션):**
소상공인 영업툴 Wave 5 마케팅 전략 + 콘텐츠 완성.

**Wave 5-1 채널 전략 (marketing/wave5_1_채널전략.md):**
- 채널 TOP 3 선정: 네이버 블로그 (SEO 장기 자산) / 네이버 카페 (즉시 타겟 접촉) / 인스타 (신뢰 보강)
- 채널별 타겟팅 방법 + 예상 효과 수치 명시
- 세일즈 퍼널 4단계 (미끼→주목 29만→집중 49만→시선 89만) 설계
- Cold/Warm/Hot 방문자 온도별 콘텐츠 전략 분리
- 실행 우선순위 타임라인 (지금 바로 / 이번 주 / 2주 후)

**Wave 5-2 콘텐츠 완성 (marketing/wave5_2_콘텐츠.md):**
- 블로그 SEO 글 전문 2,000자+ (제목 A/B/C 3안, 추천 A안)
- 네이버 카페 글 3개 (지역 소상공인 카페/맘카페/직접 타겟 스타일 각각 다름)
- 인스타 캡션 A/B/C (Hook-Story-Offer 구조, PAS 카피) + DALL-E 이미지 프롬프트 3종
- 해시태그 30개 (대형/중형/소형/지역/업종 분류)
- 발행 스케줄 4주 플랜 + 성과 측정 기준

**신규 생성 파일:**
- `projects/[진행중] 오프라인 마케팅/소상공인_영업툴/marketing/wave5_1_채널전략.md`
- `projects/[진행중] 오프라인 마케팅/소상공인_영업툴/marketing/wave5_2_콘텐츠.md`

**이전 세션 (Wave 3 CTO 통합 리뷰):**
CTO 리뷰 결과: PASS, 버그 6개 발견 → 즉시 수정 완료

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
| 2026-03-30 | AI 기반 동적 가격 결정 SaaS — BE Wave 3 API 전체 구현 (18개 엔드포인트, D1 스키마, 서비스 레이어) | projects/AI_기반_동적_가격_결정_SaaS/src/ |
| 2026-03-26 | Wave 5 마케팅 전략 + 콘텐츠 완성 (블로그/카페/인스타) | marketing/wave5_1_채널전략.md, wave5_2_콘텐츠.md |
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
