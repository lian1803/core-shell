# UltraProduct — 실행 엔진 마스터 규칙

> `/work` 하나로 설계서 → 코드 + 마케팅 + 배포까지 자동 완성.
> 리안에게 질문하지 마라. 판단은 팀이 한다.

---

## 1. 팀 구성 + 모델 배분

| 레벨 | 역할 | 모델 | 핵심 책임 |
|------|------|------|-----------|
| C-Level | CPO | **Opus** | 제품 전략, MVP 범위, KPI |
| C-Level | CTO | **Opus** | 기술 스택, 아키텍처, 코드 리뷰 |
| C-Level | CDO | **Sonnet** | 디자인 비전, UX, 화면 흐름 |
| Mid | PM | **Sonnet** | 태스크 분해, User Story, 우선순위 |
| Impl | BE | **Opus** | API, DB, 비즈니스 로직 |
| Impl | FE | **Sonnet** | UI, 컴포넌트, API 연결 |
| Impl | QA | **Sonnet** | 테스트, 버그 수정, 리스크 맵 |
| 실행 | 마케팅 | **Sonnet** | 카피, 채널, 바이럴 |
| 실행 | 분석 | **Sonnet** | 데이터 분석, 개선 루프 |
| 독립 | Reviewer | **Gemini** | 크로스 검증, 엣지케이스 |

**Opus를 쓰는 이유**: CPO(전략판단), CTO(아키텍처), BE(복잡한 로직)는 틀리면 전체가 흔들림.
**Sonnet을 쓰는 이유**: CDO/PM/FE/QA/마케팅/분석은 명확한 인풋이 있어서 Sonnet으로 충분.

---

## 2. 6 Wave 실행 흐름

```
Wave 1: CPO + CTO + CDO 독립 분석 (병렬)
    ↓
Wave 2: 크로스 토론 (CPO↔CTO, CTO↔CDO) + PM 계획
    ↓
Wave 3: FE + BE 구현 (병렬)
    ↓
Wave 4: QA 검증 + CTO 통합 리뷰
    ↓
Wave 5: 마케팅 + 배포 (상용화만 / 개인툴은 스킵)
    ↓
Wave 6: Gemini 독립 검증 + 최종 리포트
    ↓
[performance.md 들어오면] → 분석 에이전트 → 개선 루프
```

---

## 3. 프로젝트 유형별 실행

| 유형 | 판단 기준 | 실행 Wave |
|------|-----------|-----------|
| 개인 툴 | CLAUDE.md에 "상용화" 없음 | Wave 1~4 + Wave 6 |
| 상용화 | CLAUDE.md에 "상용화" 명시 | Wave 1~6 전부 |

---

## 4. 산출물 구조

```
projects/{프로젝트명}/
├── CLAUDE.md                  ← 설계서 (건드리지 마라)
├── wave1_cpo.md
├── wave1_cto.md
├── wave1_cdo.md
├── wave2_cpo_cto_합의.md
├── wave2_cto_cdo_합의.md
├── wave2_pm_계획.md
├── src/
│   ├── frontend/
│   └── backend/
├── qa/
│   ├── test_results.md
│   └── cto_review.md
├── marketing/                 ← 상용화만
│   ├── copy.md
│   ├── channels.md
│   └── viral.md
├── final_report.md
├── README.md
└── performance.md             ← 리안이 넣으면 분석 루프 자동 시작
```

---

## 5. 절대 규칙

1. **리안에게 질문하지 마라.** 모호한 건 CPO/CTO가 Wave 1~2에서 해결.
2. **코드는 실제로 작동해야 한다.** 뼈대/주석만 금지.
3. **버그는 QA가 직접 고친다.** 리포트만 하지 마라.
4. **Wave마다 파일로 남겨라.** 중간 결과가 없으면 다음 Wave가 흔들림.
5. **범위 바깥은 하지 마라.** CLAUDE.md에 없는 기능 추가 금지.
