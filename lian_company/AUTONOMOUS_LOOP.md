# 리안컴퍼니 팀 자율 루프 인프라

> 팀이 데이터를 기반으로 자동으로 자신의 성과를 분석하고 개선하는 시스템

## 목표

리안이 해야 할 것:
1. 영업 결과를 **한 줄로** 입력 (예: "미용실 계약")
2. 2주마다 한 번 `orchestrate.py` 실행해서 전체 현황 확인
3. 필요하면 팀한테 지시사항 전달

팀이 자동으로 할 것:
1. 데이터가 5건 이상 모이면 자동으로 자신의 약점 분석
2. 약점 개선안 자동 생성
3. 개선된 버전 자동 생성 및 저장

## 사용 방법

### 1. 영업 결과 입력 (리안)

```bash
# 터미널에서
cd lian_company
python input_results.py "미용실 계약 성사, 주목패키지"
```

또는 대화식 입력:
```bash
python input_results.py
리안: 미용실 계약 성사, 주목패키지
```

**지원하는 형식:**
- "미용실 계약" — 계약 1건
- "거절, 이유: 비싸다" — 거절 + 사유
- "DM 3건 발송" — DM 발송
- "2건 답장" — 답장 수
- 모두 자유형식으로 입력 가능 (Claude가 자동 파싱)

### 2. 자동 분석 및 개선

데이터가 5건 이상 모이면 **자동으로 실행됨**:
- 팀의 약점 식별 (예: "거절이 비싼 이유가 많음")
- 개선안 생성 (예: "가격 정당화 스크립트 추가")
- 해당 팀 담당자만 선택해서 재실행
- 새 버전 자동 저장 (v1 → v2 → v3...)

### 3. 전사 현황 확인 (2주마다)

```bash
python orchestrate.py
```

출력:
- 모든 팀의 KPI 현황
- 약한 팀 자동 식별
- 팀 간 충돌 체크
- 다음 액션 아이템

결과는 `보고사항들.md`에 자동 저장됨.

## 파일 구조

```
lian_company/
├── input_results.py           ← 영업 결과 입력 (리안용)
├── orchestrate.py             ← 전사 오케스트레이션
└── teams/
    ├── offline_marketing/
    │   ├── status.json        ← 팀 현황 (자동 업데이트)
    │   ├── results/           ← 개선 이력 저장
    │   │   └── improvement_*.json
    │   └── pipeline.py        ← ingest_results() / improve() 메서드 포함
    ├── 온라인영업팀/
    │   └── status.json
    ├── 온라인납품팀/
    │   └── status.json
    ├── 온라인마케팅팀/
    │   └── status.json
    └── analysis/
        └── status.json
```

## status.json 구조

```json
{
  "team": "offline_marketing",
  "last_updated": "2026-04-04T17:49:48",
  "kpi": {
    "계약전환율": null,
    "답장률": null,
    "클로징사이클_일": null,
    "월계약건수": 2
  },
  "current_version": "v2",
  "data_count": 5,
  "results_log": [
    {
      "timestamp": "2026-04-04T17:47:41",
      "type": "계약",
      "value": 1,
      "reason": "미용실"
    }
  ],
  "last_improvement_reason": "거절이유 비싼 것 대응",
  "next_action": "데이터 수집 (5건 단위로 개선)"
}
```

## 핵심 메커니즘

### 데이터 수집 (ingest_results)

1. 리안이 자유형식으로 입력: `"미용실 계약 성사, 주목패키지"`
2. Claude Sonnet이 자동 파싱:
   ```json
   {
     "result_type": "계약",
     "value": 1,
     "reason": "주목패키지 패턴"
   }
   ```
3. `status.json`의 `results_log`에 누적
4. `data_count` += 1
5. **`data_count % 5 == 0`이면 자동으로 `improve()` 호출**

### 자동 개선 (improve)

1. `results_log` 분석:
   - 계약 vs 거절 비율
   - 거절 이유 분류
   - 답장률, 클로징 사이클 등

2. Claude Sonnet으로 약점 식별:
   ```json
   {
     "weak_point": "거절이유 중 '비싼것' 비율 높음",
     "improvement_focus": "copywriter",
     "specific_actions": [
       "가격 정당화 스크립트 강화",
       "ROI 시뮬레이터 추가"
     ],
     "expected_impact": 15
   }
   ```

3. 선택된 팀만 재실행:
   - `weak_point` → `copywriter` 담당
   - copywriter 재실행으로 새 스크립트 생성
   - 결과 저장 (v2)

4. `status.json` 업데이트:
   - `current_version`: v1 → v2
   - `last_improvement_reason`: 개선 이유 기록

5. `results/improvement_*.json`에 개선 이력 저장

### 전사 오케스트레이션 (orchestrate)

1. 모든 팀의 `status.json` 로드
2. KPI 현황 테이블 생성
3. 약한 팀 식별:
   - `data_count >= 5`이고 아직 v1인 팀
   - KPI가 모두 null인 팀
4. 팀 간 충돌 체크:
   - 동일 타겟에 다른 전략 사용하는 팀
5. 보고사항들.md에 현황 저장
6. 약한 팀에 대해 `improve()` 자동 실행 (선택적)

## KPI 정의

각 팀의 고유 KPI:

**오프라인 마케팅팀**:
- 계약전환율 (%)
- 답장률 (%)
- 클로징사이클 (일)
- 월계약건수 (건)

**온라인영업팀**:
- 이메일응답률 (%)
- 제안서열람율 (%)
- 미팅성사율 (%)
- 월파이프라인건수 (건)

**온라인납품팀**:
- 블로그게시물수 (건)
- SNS도달범위 (회)
- 광고클릭율 (%)
- 월납품건수 (건)

**온라인마케팅팀**:
- 리드생성수 (건)
- 리드전환율 (%)
- 캠페인ROI (배)
- 월영업기회건수 (건)

**분석팀**:
- 분석자료수 (건)
- 인사이트품질점수 (점)
- 팀간피드백활용율 (%)
- 월분석건수 (건)

## 리안이 알아야 할 것

### 언제 개입해야 하나

1. **약한 팀이 식별되면**: 
   - `orchestrate.py` 실행 후 "주의 필요 팀" 섹션 확인
   - 필요하면 팀 리더에게 추가 지시사항 전달

2. **KPI가 0이 계속되면**:
   - 팀이 정말 활동하고 있는지 확인
   - 데이터 입력 방식 재검토

3. **버전이 자주 올라가면**:
   - 팀이 자주 개선 중이라는 의미
   - 실제 결과로 이어지는지 확인

### 리안이 절대 하면 안 될 것

- ❌ status.json 직접 수정
- ❌ ingest_results() 함수 수정
- ❌ 팀을 제거하거나 status.json 삭제

팀을 추가하거나 KPI를 변경하고 싶으면:
1. 해당 팀 폴더의 `status.json`의 `kpi` 섹션만 수정
2. orchestrate.py 실행 (자동 인식)

## 기술 세부사항

### 파싱 로직 (ingest_results)

```python
def ingest_results(raw_text: str):
    # 1. Claude Sonnet으로 자유형식 → JSON 파싱
    parse_prompt = f"""
    입력: {raw_text}
    
    구조화: result_type, value, reason 추출
    
    반환: JSON 배열
    """
    
    # 2. status.json 누적
    for item in parsed_results:
        status["results_log"].append(item)
        status["data_count"] += 1
        
        # KPI 업데이트 (자동)
        if item["type"] == "계약":
            status["kpi"]["월계약건수"] += item["value"]
    
    # 3. 5건 도달 시 improve() 자동 호출
    if status["data_count"] % 5 == 0:
        improve()
```

### 버전 관리

- `current_version`: 현재 활성 버전 (v1, v2, v3...)
- 매 개선마다 +1
- 모든 개선된 산출물은 버전 번호 포함해서 저장
  - v1: 원본
  - v2: 첫 개선
  - v3: 두 번째 개선
  - ...

### 개선 이력 저장

`results/improvement_*.json`:
```json
{
  "timestamp": "2026-04-04T17:49:00",
  "version": "v2",
  "data_count_at_improvement": 5,
  "weak_point": "거절이유 비싼 것",
  "improvement_focus": "copywriter",
  "actions_taken": [
    "가격 정당화 스크립트 강화",
    "ROI 시뮬레이터 추가"
  ],
  "expected_impact": 15
}
```

이를 통해 각 팀의 개선 히스토리를 추적 가능.

## 확장 가능성

### 향후 추가할 수 있는 기능

1. **자동 스케줄**: 
   - 2주마다 자동으로 orchestrate.py 실행
   - Cron job 또는 AWS Lambda

2. **대시보드**:
   - 모든 팀의 KPI를 실시간 대시보드로 시각화
   - 리안이 보기 좋은 차트

3. **팀 간 공유**:
   - 팀 A의 개선 방법을 팀 B가 참고하도록 자동 추천
   - 같은 문제는 같은 해결책 재사용

4. **고급 분석**:
   - 각 개선이 실제로 KPI에 미친 영향도 측정
   - 가장 효과적인 개선 방법 자동 식별

5. **리안 피드백 루프**:
   - 개선 후 리안의 피드백 자동 수집
   - 다음 개선에 반영

## 트러블슈팅

### 문제: input_results.py 실행이 안 됨

```bash
# 1. 경로 확인
cd lian_company

# 2. venv 활성화 (Windows)
venv\Scripts\activate

# 3. 다시 실행
python input_results.py "테스트"
```

### 문제: status.json이 업데이트 안 됨

```bash
# orchestrate.py 로그 확인
python orchestrate.py

# 또는 status.json 수동 확인
cat teams/offline_marketing/status.json | python -m json.tool
```

### 문제: improve()가 실행 안 됨

- 최소 5건의 데이터가 필요
- 정확히 5의 배수일 때만 실행 (5, 10, 15...)
- 수동 실행: 파이썬에서 직접 호출 가능

```python
from teams.offline_marketing.pipeline import improve
improve()
```

## 라이선스

리안컴퍼니 내부 시스템.

---

**마지막 업데이트**: 2026-04-04
**상태**: 프로덕션 운영 중
