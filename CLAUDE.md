# LAINCP 프로젝트 — 현재 상태 및 방향

## Claude 필수 규칙

### 대화 시작 시
1. `STATUS.md` 읽기 — 현재 상태 + 마지막 세션 작업 내용
2. `PROJECTS.md` 읽기 — 전체 프로젝트 목록

### 대화 종료 시 (리안이 안 시켜도 자동으로 — 반드시 실행)

⚠️ 이건 선택이 아니다. 리안이 비개발자라 저장 요청을 잊어버린다. 내가 알아서 해야 한다.

1. **memory/ 업데이트** (`C:\Users\lian1\.claude\projects\C--Users-lian1-Documents-Work-LAINCP\memory\`):
   - 이번 대화에서 변경된 프로젝트 현황 → 관련 project_*.md 업데이트
   - 새로운 피드백/결정사항 → feedback_*.md 또는 신규 파일
   - MEMORY.md 인덱스 최신화

2. **STATUS.md 업데이트** (`LAINCP/STATUS.md`):
   - 오늘 날짜 + 한 것 구체적으로
   - 다음에 할 것
   - 변경한 파일 목록

3. 변경한 파일이 있으면 Git 커밋 확인

### 언제 저장하냐
- 리안이 "끝", "다음에", "나중에", "저장", "바이" 같은 말 하면 → 즉시 저장
- 대화가 자연스럽게 마무리되는 느낌이면 → 즉시 저장
- 리안이 "/save" 치면 → 즉시 저장
- 확신 없으면 → 그냥 저장해라. 저장은 손해없다.

### 파일 수정 시
- 에이전트/스킬/설정 파일 수정하면 → STATUS.md "최근 변경" 섹션에 즉시 기록
- 이 CLAUDE.md 자체가 변경되면 → STATUS.md에 기록

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
태호 (Claude Haiku) — 트렌드 스카우팅
서윤 (Perplexity) — 실시간 웹 시장조사
민수 (GPT-4o) — 아이디어 확산, 수익모델
하은 (Gemini) — 팩트 검증, 숫자 확인
준혁 (Claude Opus) — 최종 Go/No-Go 판단
지훈 (Claude) — PRD 작성
종범 (Claude) — CLAUDE.md 설계서 생성 (시장 리서치 포함)
    ↓
projects/{프로젝트명}/CLAUDE.md 자동 저장 (시장 리서치 + 구현 지시서)
    ↓
[UltraProduct — /work 명령어]
Wave 1-0: 수아 채널 사전 판단 (상용화만)
Wave 1: CPO + CTO 병렬 → CDO (채널 + 리서치 반영 디자인)
Wave 2: 크로스 토론 + PM 계획
Wave 3: FE + BE 코드 작성 (병렬)
Wave 4: QA 검증 + CTO 리뷰
Wave 5: 마케팅 + 배포 (상용화만, 퍼널/PAS/Hook 기반)
Wave 6: Gemini 독립 검증
    ↓
완성된 코드 + 배포 + 마케팅
```

---

## 폴더 구조

```
LAINCP/
├── CLAUDE.md                    ← 이 파일 (전체 상황 정리)
├── STATUS.md                    ← 현재 상태 + 세션 로그
├── PROJECTS.md                  ← 전체 프로젝트 목록
├── .claude/
│   ├── commands/work.md         ← /work 슬래시 커맨드 ✅
│   ├── settings.json            ← Git 자동 커밋 hook ✅
│   └── agents/                  ← CPO, CTO, CDO, PM, FE, BE, QA, 마케팅, 분석 ✅
├── lian_company/                ← 리안 컴퍼니 Python 프로그램
│   ├── main.py                  ✅
│   ├── .env                     ❌ 없음 — API 키 넣어야 함
│   ├── .env.example             ✅
│   ├── agents/                  ✅ 멀티 AI 적용 완료
│   │   ├── sieun.py             ✅ Claude Sonnet (오케스트레이터)
│   │   ├── seoyun.py            ✅ Perplexity API (시장조사)
│   │   ├── minsu.py             ✅ GPT-4o (전략/수익모델)
│   │   ├── haeun.py             ✅ Gemini (팩트검증)
│   │   ├── junhyeok.py          ✅ Claude Opus (Go/No-Go)
│   │   ├── jihun.py             ✅ Claude Sonnet (PRD)
│   │   ├── jongbum.py           ✅ Claude Sonnet (설계서 + 시장 리서치 포함)
│   │   ├── sua.py               ✅ Claude Sonnet (마케팅)
│   │   └── taeho.py             ✅ Claude Haiku (트렌드)
│   ├── core/
│   │   ├── pipeline.py          ✅
│   │   ├── output.py            ✅
│   │   └── ui.py                ✅
│   └── venv/                    ✅ anthropic, openai, google-genai, python-dotenv
├── 새 폴더/                     ← 강의 자료 + 참고 자료
│   ├── Part 1~6.html            ← AI/기획/UX/린스타트업 강의
│   ├── 마케팅 설계자.html        ← Russell Brunson 세일즈 퍼널
│   └── api.txt                  ← API 키 보관
└── projects/                    ← 리안 컴퍼니 산출물 저장소
```

---

## 에이전트 지식 체계 (2026-03-26 통합 완료)

강의 자료(새 폴더/)의 핵심 지식이 에이전트 프롬프트에 압축 주입됨:

| 에이전트 | 주입된 지식 | 출처 |
|----------|------------|------|
| CDO | UX 원칙, 화면별 설계 규칙, 비주얼 디자인, 전환 최적화, 채널→디자인 반영 | Part 4 |
| 수아(마케팅) | 세일즈 퍼널, 가치 사다리, Hook-Story-Offer, PAS 카피, 방문자 온도 | 마케팅 설계자 |
| 종범(설계서) | 시장 리서치 섹션 포함 (서윤/태호/하은 데이터 → CLAUDE.md에 전달) | Part 3, 6 |

---

## 지금 해야 할 것

### 1. .env 파일 만들기
```
lian_company/.env 파일 생성:
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...
```
키는 새 폴더/api.txt에 있음.

### 2. 파이프라인 테스트
```bash
cd lian_company
./venv/Scripts/python.exe main.py "테스트 아이디어"
```

### 3. GitHub 원격 연결
레포 생성 후 URL 알려주면 연결. 자동 커밋 hook은 이미 설정됨.

---

## 핵심 원칙
- 리안은 비개발자 CEO. 개입 최소화.
- 리안 컴퍼니 = 기획 엔진 (시장 리서치 + 설계서까지)
- UltraProduct = 실행 엔진 (코드 + 배포 + 마케팅까지)
- 멀티 AI = 편향 방지 (GPT/Gemini/Perplexity/Claude 각자 다른 역할)
- 에이전트 지식 = 정적 원칙(프롬프트) + 동적 트렌드(Perplexity 실시간)

## ⛔ 절대 금지 규칙

### 새 폴더 만들지 마라
- 기존 프로젝트 폴더가 있으면 **무조건 그 안에서 작업**
- 새 폴더 생성 금지 (v2, _new, _backup, _copy 같은 변형도 금지)
- 작업 전에 `projects/` 아래에 이미 해당 프로젝트 폴더가 있는지 확인
- 모르겠으면 리안에게 "어디서 작업할까?" 물어봐라
- 이 규칙은 /work 실행 시에도, 수동 작업 시에도, 어떤 상황에서도 적용
