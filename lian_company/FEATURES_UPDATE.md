# lian_company 기능 추가 — 2026-04-05

## 개요

lian_company 시스템에 2가지 중요한 기능을 추가했습니다:
1. **시은 재검토 (델타봇 패턴)** — 이사팀 분석 일관성 자동 검증
2. **크론 모니터링** — 2시간마다 자동 운영 상태 점검

---

## 기능 1: 시은 재검토 (델타봇 패턴)

### 목적
이사팀 파이프라인에서 준혁이 GO 판정을 내린 직후, 지훈이 PRD를 작성하기 전에 **시은이 한 발 물러서서 전체 분석의 일관성을 재검토**합니다.

문제: 초기 명확화 방향과 최종 분석(민수 전략, 하은 검증, 토론)이 어긋날 수 있음.
해결: 시은이 자동으로 일관성을 체크하고 불일치 항목을 지적.

### 구현 위치
- `lian_company/agents/sieun.py` — `review()` 함수 추가
- `lian_company/core/pipeline.py` — [5.2/9] 단계에 삽입 (준혁 판정 ↔ 지훈 PRD 사이)

### 검토 내용
```
✅ 방향 일관성 판정:
  - 일관 / 부분 수정 필요 / 전면 수정

📊 초기 vs 최종 비교:
  - 타겟 고객이 일치하는가
  - 핵심 기능이 일치하는가
  - 수익 모델이 현실적인가
  - 경쟁사/시장 조건이 일치하는가

🔴 불일치 항목 (있으면만):
  - 원인 분석 + 수정 제안

💡 새로운 인사이트:
  - 토론/검증에서 나온 새로운 인사이트

⚠️ 추가 Risk:
  - 초기에 놓쳤을 가능성 있는 위험
```

### 산출물
- `04c_최종재검토_시은.md` — 재검토 결과

### 출력 예시
```
🔍 시은 | 최종 재검토 (델타봇 패턴)
==================================================

## 시은의 최종 재검토

✅ 방향 일관성: 일관

📊 초기 vs 최종 비교:
| 항목 | 초기 명확화 | 최종 분석 | 일치 여부 |
|------|----------|---------|---------|
| 타겟 | 소상공인 셀러 | 소상공인 셀러 | ✅ 일치 |
| 핵심 | 인스타 콘텐츠 | 인스타+블로그 | 🟡 확대됨 |

💡 새로운 인사이트:
- 블로그 SEO가 인스타보다 장기 효율이 높다는 검증 발견

✅ 재검토 결과: 방향 일관성 확인됨
```

---

## 기능 2: 크론 모니터링

### 목적
배포 후 **2시간마다 자동으로 운영 상태를 점검**합니다.

감지 대상:
- 에러/이슈 발생
- 팀 실행 결과 점수 이상 (7점 이하)
- 에이전트 응답 지연 (30분 이상)
- 반복되는 패턴의 에러

### 구현 위치
- `lian_company/core/ops_loop.py` — `monitor()` 함수 추가

### 사용법

#### 1회 실행 (수동)
```bash
cd lian_company
./venv/Scripts/python.exe -m core.ops_loop monitor "프로젝트명"

# 예:
./venv/Scripts/python.exe -m core.ops_loop monitor "온라인마케팅팀"
./venv/Scripts/python.exe -m core.ops_loop monitor "all"
```

#### 2시간마다 자동 실행 (Windows 작업 스케줄러)

**배치 파일 생성:** `C:\schedule_monitor.bat`
```batch
@echo off
cd C:\Users\lian1\Documents\Work\core\lian_company
call venv\Scripts\activate.bat
python -m core.ops_loop monitor all
```

**작업 스케줄러 등록:**
1. 작업 스케줄러 열기 (Win+R → taskschd.msc)
2. "기본 작업 만들기"
   - 이름: `lian_monitor`
   - 트리거: 반복 → 2시간마다
   - 작업: `C:\schedule_monitor.bat` 실행

#### Python에서 직접 호출
```python
from core.ops_loop import monitor

# 특정 프로젝트 모니터링
monitor("온라인마케팅팀")

# 모든 프로젝트 모니터링
monitor("all")
```

### 감지 로직

```
1. 보고사항들.md 스캔 (최근 2시간)
   └─ 에러 키워드 감지: "에러", "실패", "문제", "timeout" 등
   └─ 점수 이상 감지: X/10 패턴에서 <7점
   
2. Claude가 상황 분석
   └─ 🟢 정상
   └─ 🟡 주의 (경미한 이슈, 모니터링)
   └─ 🔴 긴급 (즉시 조치 필요)
   
3. 결과 저장
   └─ 보고사항들.md에 기록
   └─ Discord 알림 (이슈 있을 때만)
```

### 산출물
- `보고사항들.md` — 모니터링 리포트 추가됨
- Discord 웹훅 알림 (설정되어 있으면)

### 출력 예시
```
🔍 모니터링 | all
==================================================

## 모니터링 리포트

🟢 정상: 온라인마케팅팀 일일 루프 완료
🟡 주의: 온라인납품팀 점수 6.5/10 (블로그 카피 품질)
🟢 정상: 오프라인마케팅팀 응답 지연 없음

[추천 액션]
- 온라인납품팀: 블로그 카피 품질 개선 (SEO 키워드 강화)

📋 모니터링 결과 저장 완료
```

---

## 구현 상세

### 1. sieun.py 추가 함수

#### `review(context, client) -> dict`
- 모든 에이전트 결과 종합 검토
- 초기 명확화와 최종 분석의 불일치 감지
- Context에 `sieun_review` 추가
- Return: 수정된 context

**호출 시점:** pipeline.py [5.2/9] 단계

### 2. pipeline.py 수정

**추가된 코드** (207-223줄):
```python
# ── 시은: 최종 재검토 (델타봇 패턴) ────────────────────────────
print(f"\n[5.2/9] 최종 재검토 (시은 델타봇)...")
try:
    context = sieun.review(context, client)
    save_file(output_dir, "04c_최종재검토_시은.md", context.get("sieun_review", ""))
    print_save_ok("04c_최종재검토_시은.md")
except Exception as e:
    print(f"\n⚠️  시은 재검토 에러 (건너뜀): {e}")
```

### 3. ops_loop.py 추가 함수

#### `monitor(project_name="all")`
- 보고사항들.md 스캔 (최근 2시간)
- 에러/이슈/점수 이상 감지
- Claude로 상황 분석
- 결과 저장 + Discord 알림

**호출 방식:**
```bash
python -m core.ops_loop monitor "프로젝트명"
python -m core.ops_loop monitor "all"
```

---

## 통합 테스트

### 1. 시은 재검토 테스트
```bash
cd lian_company
./venv/Scripts/python.exe main.py "소상공인 마케팅 대행사업"

# → [5.2/9] 단계에서 시은 재검토 자동 실행
# → 04c_최종재검토_시은.md 생성 확인
```

### 2. 모니터링 테스트
```bash
# 수동 실행
./venv/Scripts/python.exe -m core.ops_loop monitor "test"

# → 보고사항들.md에 모니터링 결과 추가 확인
```

---

## 기존 코드 호환성

✅ 기존 API 변경 없음
- `sieun.run()` 동일하게 동작
- `pipeline.run_pipeline()` 호환 (새 단계만 추가)
- `ops_loop.daily_loop()` / `weekly_loop()` / `pivot_check()` 동일

✅ 선택적 실행
- 시은 재검토 실패해도 다음 단계 진행 (예외 처리)
- 모니터링 에러 발생해도 보고서 저장 (에러 무시)

---

## 향후 개선 사항

### 시은 재검토
- [ ] 불일치 감지 시 자동 수정 제안 (현재는 지적만)
- [ ] 토론 내용 상세 분석 (현재는 요약만)

### 모니터링
- [ ] 2시간 주기 자동화 (현재는 수동 호출)
- [ ] 에이전트별 응답 시간 추적
- [ ] 누적 통계 대시보드 (주간/월간)
- [ ] Slack 통합 (Discord 외)

---

## 파일 변경 목록

```
lian_company/agents/sieun.py
  + review() 함수 (90줄)
  + REVIEW_PROMPT (상수)

lian_company/core/pipeline.py
  + [5.2/9] 시은 재검토 단계 (17줄)

lian_company/core/ops_loop.py
  + monitor() 함수 (80줄)
  + MONITOR_PROMPT (상수)
  + monitor 모드 CLI 추가
```

---

## 사용 시 주의사항

1. **Anthropic API 키 필수** — sieun.review()는 Claude Sonnet 사용
2. **보고사항들.md 경로** — core/ 기준 `../../보고사항들.md`
3. **Discord 웹훅 선택** — DISCORD_WEBHOOK_URL 없으면 무시

---

End of FEATURES_UPDATE.md
