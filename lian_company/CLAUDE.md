# 리안 컴퍼니 — 기획 자동화 엔진

여기는 LAINCP 시스템의 **기획 엔진**이야.
아이디어를 받아서 시장조사 → 전략 → 검증 → PRD → 구현 지시서까지 자동으로 만들어줘.

## 실행 방법

```bash
cd lian_company
./venv/Scripts/python.exe main.py "아이디어"
```

## 파이프라인 순서

| 순서 | 에이전트 | 역할 | AI |
|------|----------|------|----|
| 1 | 시은 | 아이디어 명확화 + 모드 분류 | Claude Sonnet |
| 2 | 태호 | 트렌드 스카우팅 | Claude Haiku |
| 3 | 서윤 | 실시간 시장조사 | Perplexity |
| 4 | 민수 | 전략 수립 + 수익모델 | GPT-4o |
| 5 | 하은 | 팩트 검증 + 반론 | Gemini |
| 6 | **준혁** | **GO/NO-GO 판단** | Claude Opus |
| — | **리안 컨펌** | **진행 여부 결정** | — |
| 7 | 지훈 | PRD 작성 | Claude Sonnet |
| 8 | 종범 | 구현 지시서 생성 | Claude Sonnet |
| 9 | 수아 | 마케팅 전략 | Claude Sonnet |

## 완료 후 자동 동작

파이프라인 완료 시 `projects/{프로젝트명}/` 폴더에 CLAUDE.md 저장 후,
해당 폴더에서 Claude Code를 실행하는 **새 터미널 창이 자동으로 열려**.
새 창에서 `/work` 입력하면 UltraProduct Wave 1~6 시작.

## 환경변수 (.env)

```
ANTHROPIC_API_KEY=    # Claude (시은, 준혁, 지훈, 종범, 수아, 태호)
OPENAI_API_KEY=       # GPT-4o (민수)
GOOGLE_API_KEY=       # Gemini (하은, Wave 6 검증)
PERPLEXITY_API_KEY=   # Perplexity (서윤)
```

## 산출물 위치

- `lian_company/outputs/{날짜}_{프로젝트명}/` — 각 에이전트 결과물
- `projects/{프로젝트명}/CLAUDE.md` — UltraProduct 실행용 구현 지시서
