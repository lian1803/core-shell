# LIANCP 프로젝트 — 현재 상태 및 방향

## Claude 필수 규칙

### 대화 시작 시
1. `OPERATIONS.md` 읽기 — 시스템 전체 매뉴얼 (뭘 할 수 있는지, 어떻게 하는지)
2. `PROCESSES.md` 읽기 — **Core Processes (변경 불가 프로세스). 시스템 수정 전 반드시 확인.**
3. `STATUS.md` 있으면 읽기 — 현재 상태 + 마지막 세션 작업 내용 (개인 파일, 없을 수 있음)
4. `PROJECTS.md` 있으면 읽기 — 전체 프로젝트 목록 (개인 파일, 없을 수 있음)
5. `lian_company/.pending_questions.json` 있으면 읽기 — 팀이 멈추고 리안한테 물어봐야 하는 것. answered: false 항목 있으면 **대화 첫 마디로 바로 질문해라.**

### 리안이 뭔가 시키면
`OPERATIONS.md` 3번(의사결정 트리)를 보고 어떤 플로우를 태울지 스스로 판단해라.
리안은 비개발자이므로 "main.py 돌려줘"라고 안 한다. "이거 해줘"라고 한다.
그 말이 어떤 시스템에 해당하는지 판단하는 건 Claude의 몫이다.

### 프로젝트 시작 트리거 (최우선 인식)

리안이 아래 패턴으로 말하면 → 즉시 이사팀 소집:
- "~할거야" / "~프로젝트" / "~하고 싶어" / "~사업 해볼까" + 새 아이디어
- "이거 해줘" + 새로운 서비스/제품 설명

트리거 감지 시 Claude가 할 것:
1. "이사팀 소집할게. GO?" 확인 (리안이 OK하면)
2. `python lian_company/main.py "아이디어"` 실행
3. GO 판단 → `python lian_company/build_team.py "팀명" "목적"` 실행
4. 팀 생성 완료 → `python lian_company/run_{팀명}.py` 실행
5. 완료 → 보고사항들.md 확인 안내

단, 아래는 트리거 제외 (기존 프로젝트 이어하기):
- "어제에 이어서" / "계속" / "이거 고쳐줘" / 기존 파일 수정 요청

### 대화 종료 시

1. **memory/ 업데이트** — 이번 대화에서 변경된 프로젝트 현황이나 결정사항 있으면 memory 파일 업데이트
- 오늘 팀이 실행됐으면 → `python lian_company/input_results.py` 안내 (결과 있을 때)
2. **STATUS.md 업데이트** (파일 있는 경우) — 오늘 날짜 + 한 것 + 다음 할 것
3. 변경한 파일이 있으면 Git 커밋 확인

### 언제 저장하냐
- 리안이 "끝", "다음에", "나중에", "저장", "바이" 같은 말 하면 → 즉시 저장
- 대화가 자연스럽게 마무리되는 느낌이면 → 즉시 저장
- 리안이 "/save" 치면 → 즉시 저장
- 확신 없으면 → 그냥 저장해라. 저장은 손해없다.

### 파일 수정 시
- 에이전트/스킬/설정 파일 수정하면 → STATUS.md "최근 변경" 섹션에 즉시 기록
- 이 CLAUDE.md 자체가 변경되면 → STATUS.md에 기록

### 조직도 변경 시 (팀 신설/해체/인원 변경/모델 변경)
⚠️ 두 파일 반드시 동시 업데이트 + 재배포:
1. `회사 조직도.md` — 팀/인원 정보, 변경 이력
2. `zip/src/App.tsx` — 해당 팀 배열(boardMembers/eduMembers/analyticsMembers/ultraMembers) 수정
   - 인원 추가/삭제: 배열 항목 추가/삭제
   - 모델 변경: `ai: '모델명'` 수정 (Claude / Sonnet / Haiku / Opus / GPT-4o / Gemini / Perplexity / MiniMax)
3. 수정 후 반드시 빌드 + 배포:
   ```bash
   cd zip && npm run build && npx wrangler pages deploy dist/
   ```

---

## 이게 뭐하는 시스템이야
아이디어 하나 던지면 AI들이 자동으로 기획→설계→개발→마케팅→**운영**까지 하는 시스템.
**만들고 끝이 아니라, 배포 후 매일 돌아가는 진짜 회사.**
리안(CEO)의 개입 최소화가 핵심.

---

## 전체 플로우 (2026-04-04 업데이트)

```
리안: "이거 해봐" (한마디)
    ↓
[Layer 1: 이사팀 — python main.py "아이디어"]
시은 — 자동 명확화 (회사DNA 기반, input 없음)
태호+서윤 병렬 — 트렌드 + 시장조사
민수 — 전략 (GPT-4o)
하은 — 검증 (Gemini)
토론 루프 — 민수↔하은
준혁 — GO/NO-GO
    ↓
보고서 → 보고사항들.md 자동 저장
리안: "진행" 또는 "수정해" (input 1번)
    ↓ (GO)
시은 — 자동 워크플로우 추론 + 팀 설계
교육팀 — 팀 자동 생성
    ↓
[Layer 3: 런칭 준비 — core/launch_prep.py]
타겟 구체화 → 경쟁사 벤치마크 → 우리 상품/가격 → 영업채널 → 마케팅채널 → 첫 주 액션플랜
    ↓
[Layer 2: UltraProduct — /work] (코드 개발인 경우)
Wave 3: FE + BE → Wave 4: QA → Wave 5: 배포
    ↓
[Layer 4: 운영 루프 — core/ops_loop.py]
매일: 인스타 캡션 + 블로그 + 영업 DM 자동 생성
매주: 성과 리뷰 + 방향 수정 제안
→ 전부 보고사항들.md에 저장 → 리안이 확인
```

**핵심 변경 (2026-04-04):**
- 모든 에이전트에 회사DNA(company_context.md) 자동 주입
- 자동파일럿 모드: CLI 인자로 실행하면 input() 없이 보고서까지 자동
- 작업 전 리서치 루프: Perplexity로 최신 트렌드 자동 수집
- 자료 라우팅: 자료들/ 처리 후 해당 팀에 자동 배포

---

## 폴더 구조

```
LIANCP/
├── CLAUDE.md                    ← 이 파일 (전체 상황 정리)
├── STATUS.md                    ← 현재 상태 + 세션 로그
├── PROJECTS.md                  ← 전체 프로젝트 목록
├── 회사 조직도.md                ← 전 직원 조직도 (팀 신설 시 자동 업데이트) ✅
├── .claude/
│   ├── commands/work.md         ← /work 슬래시 커맨드 ✅
│   ├── settings.json            ← Git 자동 커밋 hook ✅
│   └── agents/                  ← CPO, CTO, CDO, PM, FE, BE, QA, 마케팅, 분석 ✅
├── lian_company/                ← 리안 컴퍼니 Python 프로그램
│   ├── main.py                  ✅ (이사팀 파이프라인)
│   ├── build_team.py            ✅ (교육팀 실행 진입점)
│   ├── offline_sales.py         ✅ (오프라인 마케팅팀 진입점)
│   ├── run_온라인영업팀.py      ✅ (온라인영업팀 실행 진입점)
│   ├── run_온라인납품팀.py      ✅ (온라인납품팀 실행 진입점)
│   ├── run_온라인마케팅팀.py    ✅ (온라인마케팅팀 실행 진입점)
│   ├── .env                     ✅ 설정됨 (Anthropic, OpenAI, Google, Perplexity, Discord)
│   ├── .env.example             ✅
│   ├── agents/                  ✅ 이사팀 에이전트
│   │   ├── sieun.py             ✅ Claude Sonnet (오케스트레이터 + 팀설계)
│   │   ├── seoyun.py            ✅ Perplexity API (시장조사)
│   │   ├── minsu.py             ✅ GPT-4o (전략/수익모델)
│   │   ├── haeun.py             ✅ Gemini (팩트검증)
│   │   ├── junhyeok.py          ✅ Claude Opus (Go/No-Go)
│   │   └── taeho.py             ✅ Claude Haiku (트렌드)
│   │   [해고: jihun.py, jongbum.py, sua.py → 팀 전문 에이전트로 대체]
│   ├── teams/                   ← 전문 팀들
│   │   ├── education/           ✅ 교육팀 (도윤+서윤)
│   │   │   ├── curriculum_designer.py  ← Opus 커리큘럼 설계
│   │   │   ├── trainer.py              ← Perplexity 지식 수집
│   │   │   ├── team_generator.py       ← 팀 파일 자동 생성
│   │   │   └── pipeline.py
│   │   ├── offline_marketing/   ✅ 오프라인 마케팅 팀 (재원+승현+예진+검증자)
│   │   │   ├── researcher.py    ← Perplexity 영업 자료 수집
│   │   │   ├── strategist.py    ← Claude Sonnet 전략 수립
│   │   │   ├── copywriter.py    ← Claude Sonnet DM/스크립트
│   │   │   ├── validator.py     ← Claude Opus 현장 검증
│   │   │   └── pipeline.py
│   │   ├── analysis/            ✅ 분석팀 (Gemini 비전)
│   │   │   ├── analyzer.py      ← Gemini로 이미지/영상 분석
│   │   │   └── pipeline.py      ← 독립 실행 (자료들/ 스캔)
│   │   ├── 온라인영업팀/        ✅ 온라인 영업 팀 (build_team.py 자동생성 2026-04-02)
│   │   │   ├── 박탐정.py        ← 잠재고객 분석
│   │   │   ├── 이진단.py        ← 온라인 현황 진단서
│   │   │   ├── 김작가.py        ← 아웃리치 스크립트
│   │   │   ├── 최제안.py        ← 제안서/가격표
│   │   │   ├── 정클로저.py      ← 미팅 대본/클로징
│   │   │   ├── 한총괄.py        ← 파이프라인 총괄
│   │   │   └── pipeline.py
│   │   ├── 온라인납품팀/        ✅ 온라인 납품 팀 (build_team.py 자동생성 2026-04-02)
│   │   │   ├── 서진호.py        ← SEO 키워드 전략
│   │   │   ├── 한서연.py        ← 네이버 블로그 작성
│   │   │   ├── 박지우.py        ← 인스타그램 콘텐츠
│   │   │   ├── 최도현.py        ← 퍼포먼스 광고 카피
│   │   │   ├── 윤하은.py        ← 상세페이지 카피
│   │   │   ├── 정민재.py        ← 성과 분석·리포트
│   │   │   ├── 김태리.py        ← 납품 총괄 PM
│   │   │   └── pipeline.py
│   │   └── 온라인마케팅팀/      ✅ 온라인 마케팅 팀 (build_team.py 자동생성 2026-04-02)
│   │       ├── 서진혁.py        ← 리드 헌터
│   │       ├── 한소율.py        ← 세일즈 매니저
│   │       ├── 윤채원.py        ← 마케팅 전략가
│   │       ├── 박시우.py        ← 크리에이티브 디렉터
│   │       ├── 이도현.py        ← 운영 매니저
│   │       ├── 강하린.py        ← 그로스 애널리스트
│   │       └── pipeline.py
│   ├── knowledge/               ← 지식 관리 시스템 ✅
│   │   ├── manager.py           ← 저장/검색/피드백/공유
│   │   ├── index.json           ← 교육팀이 관리하는 인덱스
│   │   ├── base/                ← 공유 지식 (교육팀이 수집/관리)
│   │   ├── teams/               ← 팀별 결과물 + 피드백
│   │   ├── inbox/               ← 리안이 넣는 캡쳐/영상 (분석팀이 처리)
│   │   └── trends/              ← 자동 수집 트렌드 (❌ 미구현)
│   ├── company_context.md        ← 회사 DNA (모든 에이전트 자동 주입) ✅
│   ├── core/
│   │   ├── pipeline.py          ✅ (자동파일럿 모드 추가)
│   │   ├── context_loader.py    ✅ (회사DNA 주입 유틸)
│   │   ├── research_loop.py     ✅ (작업 전 Perplexity 자동 리서치)
│   │   ├── launch_prep.py       ✅ (Layer 3: 런칭 준비)
│   │   ├── ops_loop.py          ✅ (Layer 4: 운영 루프)
│   │   ├── report_generator.py  ✅ (이사팀 보고서 생성)
│   │   ├── output.py            ✅
│   │   └── ui.py                ✅
│   ├── archive/                 ← ✅ UltraProduct 프로젝트 설계 결과물 (절대 삭제 금지)
│   │   ├── lian_company_design/   리안 컴퍼니 자체 설계 결과물 (CPO/CTO/CDO + QA)
│   │   └── Lian_Dash/            마케팅 데이터 분석 SaaS 설계 결과물 (CPO/CTO/CDO)
│   └── venv/                    ✅ anthropic, openai, google-genai, python-dotenv
├── 자료들/                      ← 리안이 자료 던져넣는 폴더 ✅
│   (txt/md/html → 도윤이 읽고 knowledge/base/ 저장 + 파일 삭제)
│   (이미지/영상 → 분석팀(Gemini) 자동 처리 ✅)
│   (PDF → pdfplumber 필요, 현재 스킵)
├── 보고사항들.md                ← 에이전트 → 리안 보고 ✅
└── team/                        ← 프로젝트 팀 폴더 (구 projects/)
```

---

## 에이전트 지식 체계

에이전트 지식은 `knowledge/base/`에 저장 → 교육팀이 새 팀 만들 때 자동 배포

---

## 자료 던져넣기 + 보고 확인

### 자료들/ 폴더
리안이 아무 자료나 던져넣으면 도윤이 알아서 처리:
```
자료들/아무파일.txt  or  .md  or  .html
→ python lian_company/process_inbox.py
→ knowledge/base/ 저장 + 원본 삭제 + 보고사항들.md 업데이트
```
지원: .txt .md .html .png .jpg .jpeg .webp .gif .bmp .mp4 .mov .avi .mkv .webm | 스킵: PDF(pdfplumber 필요)

### 보고사항들.md
에이전트들이 일 끝나면 여기에 자동 보고. 리안이 확인하는 공간.
- `write_report(agent_name, role, content)` — knowledge/manager.py에서 임포트
- 모든 팀 pipeline.py에서 완료 시 자동 호출

---

## 환경 상태

- `.env`: ✅ 전부 설정됨 (Anthropic, OpenAI, Google, Perplexity, Discord)
- `venv`: ✅ lian_company/venv/ 설치됨
- Git: ✅ 자동 커밋 hook 동작중 (.claude/settings.json)

---

## 핵심 원칙
- 사용자 개입 최소화
- 리안 컴퍼니 = 기획 엔진 (시장 리서치 + 설계서까지)
- UltraProduct = 실행 엔진 (코드 + 배포 + 마케팅까지)
- 멀티 AI = 편향 방지 (GPT/Gemini/Perplexity/Claude 각자 다른 역할)
- 에이전트 지식 = 정적 원칙(프롬프트) + 동적 트렌드(Perplexity 실시간)
- 직원 성장 = 경험 기록(experience.jsonl) + 피드백 누적 + 자기 개발(낮은 평점 → Perplexity 학습)

### 리안이 시스템 자체를 바꾸려면
"시스템 바꿔줘" / "에이전트 수정해줘" / "플로우 업그레이드해줘"
→ `Agent(subagent_type="architect")` 로 도현(시스템 아키텍트) 스폰
→ 도현이 변경 계획서 제출 → 리안 컨펌 → 실행

## ⛔ 절대 금지 규칙

### archive/lian_company_design/ 절대 삭제 금지
- `lian_company/archive/lian_company_design/` 폴더는 **리안 컴퍼니 자체를 UltraProduct로 설계한 결과물 원본**
- CPO/CTO/CDO Wave1~2 + QA 결과물이 들어있음 — 지우면 복구 불가
- 어떤 상황에서도 삭제, 이동, 이름 변경 금지

### 새 폴더 만들지 마라
- 기존 프로젝트 폴더가 있으면 **무조건 그 안에서 작업**
- 새 폴더 생성 금지 (v2, _new, _backup, _copy 같은 변형도 금지)
- 작업 전에 `team/` 아래에 이미 해당 프로젝트 폴더가 있는지 확인
- 모르겠으면 리안에게 "어디서 작업할까?" 물어봐라
- 이 규칙은 /work 실행 시에도, 수동 작업 시에도, 어떤 상황에서도 적용

### 새 팀은 반드시 교육팀(build_team.py)으로 만들어라
- 새 팀 필요하면 → `python lian_company/build_team.py "팀이름" "팀 목적"`
- **절대 수동으로 에이전트 .py 파일을 직접 작성하지 마라**
- 교육팀이 알아서: Opus 커리큘럼 설계 → Perplexity 세계 최고 지식 수집 → 코드 자동 생성 → 조직도 업데이트
- 기획서가 있으면 팀 목적에 기획서 핵심 내용을 요약해서 넘겨라 (길수록 좋다)
- 상세 플로우: `OPERATIONS.md` 7번 참고
