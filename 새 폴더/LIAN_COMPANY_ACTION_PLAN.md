# 리안 컴퍼니 — 완전 설계서 (Claude Code 복붙용)

## 이게 뭐냐
여러 AI(GPT, Claude, Gemini, Perplexity)를 "회사 직원"처럼 써서,
아이디어가 들어오면 자동으로 조사 → 평가 → 설계 → 팀 신설 → 실행 → 성과 분석 → 개선 루프까지 도는 시스템.

---

## 조직도

```
리안 (CEO) — 아이디어/질문/문제 던지기만 함
  │
  └─ 시은 (이사, Python 오케스트레이터) — 전체 컨트롤타워
       │
       ├─ [1층-a] 서윤 (리서치) — Perplexity API
       │   ├─ 온디맨드 시장 조사 (모드 A~C)
       │   └─ 툴/API 추천 (모드 E): 만들 때 최적 스택 찾기
       │
       ├─ [1층-b] 태호 (스카우터) — 무료 크롤링 + LLM 필터
       │   ├─ 수집기: GitHub Trending / Reddit / RSS / Product Hunt (무료)
       │   ├─ 필터: Claude 1회 ("이 중에 리안한테 의미 있는 거?")
       │   └─ 시은에게 요약 전달 → 리안에게 알림 (모드 D)
       │
       ├─ [2층] 이사팀 토론 (자동 순차 호출)
       │   ├─ 1단계: 민수 (GPT) — 아이디어 확산, 수익모델 제안
       │   ├─ 2단계: 하은 (Gemini) — 숫자/팩트 검증, 경쟁사 비교
       │   └─ 3단계: 준혁 (Claude) — 리스크 판단, 최종 결론 (해/보류/폐기)
       │
       └─ [3층] 실행팀 (아이디어마다 동적 생성)
           │
           ├─ 지훈 (기획) — PRD, 스펙 작성
           ├─ 종범 (개발) — Claude Code로 코드 구현
           ├─ 수아 (마케팅) — 랜딩페이지, 카피, 광고
           ├─ 영진 (데이터/분석) — 성과 분석, ROAS, 퍼널 분석
           ├─ ... (필요에 따라 추가)
           │
           └─ [실행 루프] ← 핵심!
               실행 → 데이터 수집 → 분석 → 개선안 → 재실행
               (성과 나올 때까지 자동 반복)
```

---

## 5가지 입력 모드

### 모드 A: 직접 아이디어
> "시은아, 소상공인 AI 상세페이지 자동 생성 서비스 만들고 싶어"

### 모드 B: 문제/상황 투입
> "시은아, 아빠가 일이 없어. 집에 각인기계, 레이저커터 있어."

### 모드 C: 호기심 → 자동 사업 기회 감지
> "시은아, 해외여행 중 실종되는 사람이 얼마나 있어?"

### 모드 D: 자동 스카우팅 (뉴스피드형)
> 태호가 매일 알아서 트렌드·신규 툴·시장 빈틈 찾아옴

### 모드 E: 툴/API 추천
> "시은아, CS 자동화 만들고 싶은데 뭘로 해야 돼?"

---

## 실행 루프 (3층 실행팀 내부)

### 예시: 마케팅 팀

```
Sprint 1: 수아 → 카피 3종 + 랜딩 / 종범 → 배포 + 트래킹
Sprint 2: 영진 → 데이터 분석 (ROAS, CTR, 이탈률)
Sprint 3: 영진 → "ROAS 1.2. 원인: 랜딩 이탈 78%" → 수아 개선안 → 종범 재배포
Sprint 4: 반복 (목표 달성까지)
```

루프 판단: 목표 달성 → 종료 / 3회 무개선 → 이사팀 재평가 / 최대 5 Sprint

---

## 비용 추정

| 시나리오 | 비용 |
|---------|------|
| 아이디어 평가만 | $0.08~0.28 |
| 평가 → 배포까지 | $3~21 |
| 실행 루프 5회 | $0.65~3.00 |
| 태호 스카우팅 (월) | $0.5~2 |
| **사람 시키면** | **50~500만원+** |

---

## 이사팀 최종 출력 JSON 스키마

```json
{
  "idea_summary": "string",
  "category": "A: 신기술 | B: 비즈니스 | C: 자동화 | D: 기타",
  "revenue_models": [{"model": "string", "description": "string"}],
  "estimated_resources": {"time": "string", "cost": "string", "difficulty": "1~10"},
  "roi_priority": {"verdict": "해 | 보류 | 폐기", "reason": "string"},
  "high_level_flow": ["string"],
  "required_teams": [{"team": "string", "lead": "string", "role": "string"}],
  "execution_loop": {"target_kpi": "string", "sprint_duration": "7일", "max_sprints": 5},
  "alternatives": "string"
}
```

---
---
---

# Phase 1: Claude Code 복붙 프롬프트

아래를 Claude Code에 통째로 복붙하세요.

```
이 프롬프트 전체를 읽고 "리안 컴퍼니" Phase 1을 구현해줘.

# 프로젝트 개요
여러 LLM API를 순차 호출하는 오케스트레이터 "시은"을 만든다.
입력: 사용자의 아이디어/질문/문제 (텍스트)
출력: 이사팀 최종 평가 JSON

# 폴더 구조
lian_company/
├── main.py
├── orchestrator.py
├── config.py
├── agents/
│   ├── __init__.py
│   ├── base_agent.py
│   ├── researcher.py          # 서윤 (Perplexity Sonar)
│   ├── scout.py               # 태호 (크롤링 + LLM 필터)
│   ├── planner_gpt.py         # 민수 (GPT-4o)
│   ├── planner_gemini.py      # 하은 (Gemini 2.0 Flash)
│   └── planner_claude.py      # 준혁 (Claude Sonnet)
├── prompts/
│   ├── researcher_system.txt
│   ├── planner_gpt_system.txt
│   ├── planner_gemini_system.txt
│   └── planner_claude_system.txt
├── templates/
│   └── board_output_schema.json
├── outputs/
├── .env
├── requirements.txt
└── README.md

# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
PERPLEXITY_API_KEY=pplx-...

# 시스템 프롬프트

서윤 (Perplexity):
"너는 서윤, 리안 컴퍼니의 시장 리서처다. 주어진 아이디어에 대해: 1) 시장 규모/트렌드 2) 경쟁사 3~5개(이름,URL,약점) 3) 타겟 Pain Point 4) 최신 기술/툴/API를 웹 검색으로 수집해 구조화된 보고서로 정리해라. 출처 URL 필수. 추측은 추정으로 표기."

민수 (GPT-4o):
"너는 민수, 비즈니스 전략가다. 서윤의 리서치를 받아: 1) 수익모델 2~3개 2) 실행 플로우(기획→개발→마케팅→운영) 3) 리소스 추정(시간/비용/난이도) 4) 페르소나 5) 6주 로드맵. 창의적으로 확산해라."

하은 (Gemini):
"너는 하은, 팩트체커다. 민수의 전략을 받아: 1) 시장 숫자 검증 2) 경쟁사 정보 정확성 3) 비용 현실성 4) 기술 난이도 확인 5) 놓친 데이터 추가. 감이 아니라 근거로. 미검증은 미검증 표기."

준혁 (Claude):
"너는 준혁, 리스크 분석가이자 최종 의사결정자다. 서윤+민수+하은 결과 전체를 받아: 1) 기회 vs 리스크 2) 실패 시나리오 3개 3) 1인 개발자로 가능한가 4) 최종: 해/보류/폐기+이유 5) 필요 팀 구성+KPI 6) 더 나은 대안. 반드시 JSON 스키마로 출력. 근거 없는 낙관은 폐기."

# 파이프라인
1. main.py → 사용자 입력
2. orchestrator.py → 순차 호출:
   a. researcher.py → Perplexity API → 리서치 보고서
   b. planner_gpt.py → GPT API → 전략 제안
   c. planner_gemini.py → Gemini API → 팩트 검증
   d. planner_claude.py → Claude API → 최종 JSON
3. outputs/{timestamp}_{slug}/ 에 저장:
   - 01_research.md
   - 02_strategy.md
   - 03_verification.md
   - 04_final_decision.json
4. 콘솔 진행상황: [서윤] 리서치 중... [민수] 전략 중... [하은] 검증 중... [준혁] 판단 중... [시은] 완료!

# 기술 스택
- Python 3.11+, httpx, python-dotenv, openai, anthropic, google-generativeai
- 에러: API 실패 시 재시도 1회, 2회 실패 시 스킵+경고
- 타임아웃: 에이전트당 60초
- base_agent.py 상속 구조

# 참고 레포
- https://github.com/AI-MickyJ/Mixture-of-Agents
- https://github.com/rhofkens/business-idea-multi-agent
- https://dev.to/setas/i-run-a-solo-company-with-ai-agent-departments-50nf

구현 시작해줘.
```

---
---
---

# Phase 2: Claude Code 복붙 프롬프트

Phase 1이 돌아간 후 아래를 복붙하세요.

```
기존 lian_company/에 Phase 2를 추가해줘.

# 목표
이사팀 결론이 "해"일 때 실행팀 자동 구성 + 작업 지시 + 실행 루프

# 추가 파일
lian_company/
├── executor.py
├── agents/
│   ├── planner_team.py    # 지훈 (기획 — PRD)
│   ├── dev_team.py        # 종범 (개발 — 구현 지시서)
│   ├── marketing_team.py  # 수아 (마케팅 — 카피/랜딩)
│   └── analyst_team.py    # 영진 (분석 — ROAS/퍼널)
└── prompts/
    ├── planner_team_system.txt
    ├── dev_team_system.txt
    ├── marketing_team_system.txt
    └── analyst_team_system.txt

# 실행 플로우
1. 준혁 JSON → verdict "해" → executor.py 호출
2. required_teams 읽어서 필요한 에이전트만 활성화
3. 지훈 → PRD / 종범 → 구현 지시서 / 수아 → 카피
4. outputs/{프로젝트}/에 저장

# 실행 루프 (Sprint)
executor.py에 sprint_loop():
1. Sprint 1: 산출물 생성
2. Sprint 2+: 영진이 성과 데이터 분석 (사용자가 CLI로 숫자 입력)
3. 개선안 → 수아/종범 재실행
4. 목표 달성 → 종료 / 3회 무개선 → 이사팀 재평가 / 최대 5 Sprint

# 영진 시스템 프롬프트
"너는 영진, 데이터 분석가다. 성과 데이터를 받아: 1) 핵심 지표 분석 2) 퍼널 병목 3) 원인 분석 4) 개선안 3개(우선순위) 5) 다음 Sprint 가설 1개. 숫자로 말해라."

구현해줘.
```

---
---
---

# Phase 3: Claude Code 복붙 프롬프트

Phase 2가 돌아간 후 아래를 복붙하세요.

```
기존 lian_company/에 Phase 3를 추가해줘.

# 목표
모드 B~E 지원 + 태호 스카우터 자동 실행

# 1. 입력 모드 분류기 (orchestrator.py 수정)
Claude 1회 호출로 자동 판별:
A=아이디어, B=문제/상황, C=질문(사업기회감지), E=툴추천

# 2. 모드별 서윤 프롬프트 분기
B: "이 장비/상황으로 할 수 있는 사업 5개 + 시장성"
C: "이 질문 데이터 + 관련 사업 기회 자동 스캔"
E: "2026년 기준 이 목적 최신 툴/API 비교"

# 3. 태호 (scout.py) 
수집 소스 (무료):
- GitHub Trending (scrape)
- Hacker News API (https://hacker-news.firebaseio.com/v0/)
- Product Hunt RSS
- Reddit API (r/SaaS, r/entrepreneur, r/artificial)
- TechCrunch RSS

수집 후 Claude 1회:
"오늘 수집된 뉴스 중 리안(1인 개발자, 이커머스, AI 도구, 한국 시장)에게 의미 있는 것만 골라 한 줄 요약 + 이유"

CLI: python main.py --scout (수동) / --scout --schedule (매일 09:00)
저장: outputs/scout/{날짜}.md

구현해줘.
```

---

## 참고 자료

### 코드/구조
- Mixture-of-Agents: https://github.com/AI-MickyJ/Mixture-of-Agents
- Business idea multi-agent: https://github.com/rhofkens/business-idea-multi-agent
- Claude Code 멀티에이전트: https://github.com/gtrusler/claude-code-heavy
- 1인 AI 회사 8개 부서: https://dev.to/setas/i-run-a-solo-company-with-ai-agent-departments-50nf

### 패턴/이론
- Agentic Workflows: https://www.vellum.ai/blog/agentic-workflows-emerging-architectures-and-design-patterns
- Multi-Agent Business Advice 논문: https://web3.arxiv.org/abs/2601.12024
- Multi-Agent 2026 가이드: https://dev.to/eira-wexford/how-to-build-multi-agent-systems-complete-2026-guide-1io6

### 실전
- 500 프롬프트 모델 비교: https://www.reddit.com/r/ClaudeAI/comments/1p4ih0q/
- CLAUDE.md 멀티에이전트: https://www.reddit.com/r/claude/comments/1ra4czy/
- 해외 1인 AI 회사 트렌드: https://orbilontech.com/ai-automation-1b-one-person-company/
