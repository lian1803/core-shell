# LIANCP 프로젝트 — 현재 상태 및 방향

## Claude 필수 규칙

### 대화 시작 시
1. `STATUS.md` 읽기 — 현재 상태 + 마지막 세션 작업 내용
2. `PROJECTS.md` 읽기 — 전체 프로젝트 목록

### 대화 종료 시 (리안이 안 시켜도 자동으로 — 반드시 실행)

⚠️ 이건 선택이 아니다. 리안이 비개발자라 저장 요청을 잊어버린다. 내가 알아서 해야 한다.

1. **memory/ 업데이트** (`C:\Users\lian1\.claude\projects\C--Users-lian1-Documents-Work-LIANCP\memory\`):
   - 이번 대화에서 변경된 프로젝트 현황 → 관련 project_*.md 업데이트
   - 새로운 피드백/결정사항 → feedback_*.md 또는 신규 파일
   - MEMORY.md 인덱스 최신화

2. **STATUS.md 업데이트** (`LIANCP/STATUS.md`):
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
아이디어 하나 던지면 AI들이 자동으로 기획→설계→개발→마케팅까지 완성해주는 시스템.
리안(CEO)의 개입 최소화가 핵심.

---

## 전체 플로우 (2026-03-31 개편)

```
리안: 아이디어 던짐
    ↓
[이사팀 — python main.py]
시은 (Claude Sonnet) — 오케스트레이터. 아이디어 명확화
태호 (Claude Haiku) — 트렌드 스카우팅
서윤 (Perplexity) — 실시간 시장조사
민수 (GPT-4o) — 전략/수익모델
하은 (Gemini) — 팩트 검증/반론
준혁 (Claude Opus) — GO/NO-GO 판단
    ↓ (GO)
[리안 인터뷰 — 시은이 진행, 실제 워크플로우 파악]
    ↓
[팀 설계 — 시은]
    ↓ 🔴 리안 확인/수정 🔴
    ↓
[교육팀 — python build_team.py]
도윤 (Claude Opus) — 커리큘럼 설계
서윤 (Perplexity) — 지식 수집
→ 팀 파일 자동 생성 (teams/{팀명}/)
    ↓
[생성된 팀 실행 — python run_{팀명}.py]
팀 인터뷰 → 에이전트 실행 → 결과물 저장 → 리안 피드백
    ↓
[UltraProduct — /work 명령어] (코드 개발 프로젝트인 경우)
Wave 1: CPO + CTO 병렬 → CDO
Wave 2: 크로스 토론 + PM
Wave 3: FE + BE (병렬)
Wave 4: QA + CTO 리뷰
Wave 5: 마케팅 + 배포 (상용화만)
Wave 6: Gemini 독립 검증
```

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
│   ├── .env                     ❌ 없음 — API 키 넣어야 함
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
│   │   ├── offline_marketing/   ✅ 오프라인 마케팅 팀 (재원+승현+예진)
│   │   │   ├── researcher.py    ← Perplexity 영업 자료 수집
│   │   │   ├── strategist.py    ← Claude Sonnet 전략 수립
│   │   │   ├── copywriter.py    ← Claude Sonnet DM/스크립트
│   │   │   └── pipeline.py
│   │   └── analysis/            ✅ 분석팀 (Gemini 비전)
│   │       ├── analyzer.py      ← Gemini로 이미지/영상 분석
│   │       └── pipeline.py      ← 독립 실행 (자료들/ 스캔)
│   ├── knowledge/               ← 지식 관리 시스템 ✅
│   │   ├── manager.py           ← 저장/검색/피드백/공유
│   │   ├── index.json           ← 교육팀이 관리하는 인덱스
│   │   ├── base/                ← 공유 지식 (교육팀이 수집/관리)
│   │   ├── teams/               ← 팀별 결과물 + 피드백
│   │   ├── inbox/               ← 리안이 넣는 캡쳐/영상 (분석팀이 처리)
│   │   └── trends/              ← 자동 수집 트렌드 (❌ 미구현)
│   ├── core/
│   │   ├── pipeline.py          ✅
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

## 에이전트 지식 체계 (2026-03-31 개편)

이전: CDO/수아/종범 프롬프트에 직접 주입 → **현재: 이 3명 해고됨**
신규 방식: `knowledge/base/`에 저장 → 교육팀이 새 팀 만들 때 자동 배포

| 지식 | 출처 | 현재 상태 |
|------|------|----------|
| UX 설계 원칙 | 교육팀이 수집 | ❌ knowledge/base/ 마이그레이션 필요 |
| 세일즈 퍼널 (Hook-Story-Offer) | 교육팀이 수집 | ❌ knowledge/base/ 마이그레이션 필요 |
| 서비스 기획/PRD | 교육팀이 수집 | ❌ knowledge/base/ 마이그레이션 필요 |
| 영업 기법 | 교육팀 초기 수집 | ✅ knowledge/base/영업_기법.md |
| 오프라인 마케팅 결과물 | 팀 실행 | ✅ knowledge/teams/offline_marketing/ |

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

## 지금 해야 할 것

### 1. .env 파일 만들기
```
lian_company/.env 파일 생성:
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...
```
키는 lian_company/.env에 있음.

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

### archive/lian_company_design/ 절대 삭제 금지
- `lian_company/archive/lian_company_design/` 폴더는 **리안 컴퍼니 자체를 UltraProduct로 설계한 결과물 원본**
- CPO/CTO/CDO Wave1~2 + QA 결과물이 들어있음 — 지우면 복구 불가
- 어떤 상황에서도 삭제, 이동, 이름 변경 금지

### 새 폴더 만들지 마라
- 기존 프로젝트 폴더가 있으면 **무조건 그 안에서 작업**
- 새 폴더 생성 금지 (v2, _new, _backup, _copy 같은 변형도 금지)
- 작업 전에 `projects/` 아래에 이미 해당 프로젝트 폴더가 있는지 확인
- 모르겠으면 리안에게 "어디서 작업할까?" 물어봐라
- 이 규칙은 /work 실행 시에도, 수동 작업 시에도, 어떤 상황에서도 적용
