# LAINCP 프로젝트 — 현재 상태 및 방향

## 자동 참조 파일 (매 대화 시작 시 반드시 읽을 것)
- `STATUS.md` — 지금 뭐가 됐고 뭐 하는 중인지. **작업 시작/종료 시 항상 업데이트**
- `PROJECTS.md` — 전체 프로젝트 목록 및 기능 요약. **새 프로젝트 생성 시 항상 업데이트**

> Claude에게: 대화 시작 시 STATUS.md와 PROJECTS.md를 읽어라. 작업 완료 후 STATUS.md를 업데이트하라. 리안이 따로 말하지 않아도 자동으로 기록하라.

---

## 이게 뭐하는 시스템이야
아이디어 하나 던지면 AI들이 자동으로 기획→설계→개발→마케팅까지 완성해주는 시스템.
리안(CEO)의 개입 최소화가 핵심.

---

## 전체 플로우

```
리안: 아이디어 던짐
    ↓
[리안 컴퍼니 — python main.py]
시은 (Claude) — 모드 분류 + 오케스트레이션
서윤 (Perplexity) — 실시간 웹 시장조사
민수 (GPT-4o) — 아이디어 확산, 수익모델
하은 (Gemini) — 팩트 검증, 숫자 확인
준혁 (Claude Opus) — 최종 Go/No-Go 판단
지훈 (Claude) — PRD 작성
종범 (Claude) — UltraProduct용 CLAUDE.md 설계서 생성
    ↓
projects/{프로젝트명}/CLAUDE.md 자동 저장
    ↓
[UltraProduct — /work 명령어]
Wave 1: CPO + CTO + CDO 병렬 분석
Wave 2: 크로스 토론 + PM 계획
Wave 3: FE + BE 코드 작성 (병렬)
Wave 4: QA 검증 + CTO 리뷰
Wave 5: 마케팅 + 배포 (상용화만)
Wave 6: Gemini 독립 검증
    ↓
완성된 코드 + 배포 + 마케팅
```

---

## 폴더 구조

```
LAINCP/
├── CLAUDE.md                    ← 이 파일 (전체 상황 정리)
├── .claude/
│   ├── commands/work.md         ← /work 슬래시 커맨드 ✅
│   └── agents/                  ← CPO, CTO, CDO, PM, FE, BE, QA, 마케팅, 분석 ✅
├── lian_company/                ← 리안 컴퍼니 Python 프로그램
│   ├── main.py                  ✅ 있음
│   ├── .env                     ❌ 없음 — API 키 넣어야 함
│   ├── .env.example             ✅ 있음
│   ├── agents/                  ⚠️ 있지만 전부 Anthropic API만 씀 — 수정 필요
│   │   ├── sieun.py             (Claude — 오케스트레이터) ✅
│   │   ├── seoyun.py            ❌ Perplexity API로 바꿔야 함
│   │   ├── minsu.py             ❌ GPT-4o로 바꿔야 함
│   │   ├── haeun.py             ❌ Gemini로 바꿔야 함
│   │   ├── junhyeok.py          (Claude Opus) ✅
│   │   ├── jihun.py             (Claude — PRD) ✅
│   │   ├── jongbum.py           (Claude — 설계서) ✅
│   │   ├── sua.py               (Claude — 마케팅) ✅
│   │   └── taeho.py             (Claude Haiku — 트렌드) ✅
│   ├── core/
│   │   ├── pipeline.py          ✅ 있음
│   │   └── output.py            ✅ 있음
│   └── venv/                    ✅ anthropic, python-dotenv 설치됨
├── ultraproduct/                ← UltraProduct 원본 (참고용)
│   ├── CLAUDE.md
│   ├── agents/
│   └── commands/work.md
└── projects/                    ← 리안 컴퍼니 산출물 저장소
    └── lian_company/
        └── CLAUDE.md            ✅ UltraProduct 설계서 (테스트용)
```

---

## 지금 당장 해야 할 것 (우선순위 순)

### 1. .env 파일 만들기 (5분)
```
lian_company/.env 파일 생성:
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...
PERPLEXITY_API_KEY=pplx-...
```
키는 새폴더/api.txt에 있음.

### 2. 에이전트 멀티 AI로 수정 (핵심 작업)
- seoyun.py → Perplexity API (실시간 웹 검색, openai 라이브러리 호환)
- minsu.py → OpenAI API (GPT-4o)
- haeun.py → Google Generativeai (Gemini 2.0 Flash)
- 패키지 추가 설치 필요: openai, google-generativeai

### 3. 테스트
```bash
cd lian_company
./venv/Scripts/python.exe main.py "소상공인 인스타 캡션 자동화"
```

### 4. UltraProduct 테스트
- projects/lian_company/ 폴더에서 /work 실행

---

## API 키 위치
새폴더/api.txt에 있음 (Claude, Gemini, Perplexity, GPT 4개)

## 설치된 패키지
anthropic, python-dotenv (venv에 있음)
아직 없는 것: openai, google-generativeai

---

## 핵심 원칙
- 리안은 비개발자 CEO. 개입 최소화.
- 리안 컴퍼니 = 기획 엔진 (설계서까지)
- UltraProduct = 실행 엔진 (코드까지)
- 멀티 AI = 편향 방지 (GPT/Gemini/Perplexity/Claude 각자 다른 역할)
