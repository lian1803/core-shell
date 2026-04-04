# Meta Ads API 설정 가이드

## 개요

lian_company 시스템에 Meta 광고 분석 기능(5가지)이 추가되었습니다.

- `spy()`: 경쟁사 광고 수집 및 분석
- `find_gaps()`: 경쟁사 틈새 시장 찾기
- `generate_copy()`: 광고 카피 자동 생성 (3가지 버전)
- `audit()`: 광고 계정 종합 감사 (186가지 기준)
- `score()`: 광고 카피 점수 평가 (0-100점)

## 필수 설정

### 1. Meta Access Token 발급

#### Step 1: Meta Business Suite 접속
```
https://business.facebook.com/
```

#### Step 2: 앱 설정
1. 좌측 메뉴 → "설정" → "액세스 토큰"
2. "토큰 생성" 클릭
3. 필요한 권한:
   - `ads:read` — 광고 라이브러리 읽기
   - `business_management` — 비즈니스 관리

#### Step 3: 토큰 복사
생성된 토큰을 복사합니다 (예: `EAABL...xyz`)

### 2. .env 파일에 추가

`C:/Users/lian1/Documents/Work/core/lian_company/.env` 파일을 열고:

```env
# Meta Ads Library API
META_ACCESS_TOKEN=YOUR_TOKEN_HERE
```

예시:
```env
META_ACCESS_TOKEN=EAAbloW...rest_of_token_here
```

### 3. 토큰 유효성 확인

```bash
cd "C:/Users/lian1/Documents/Work/core/lian_company"
./venv/Scripts/python.exe -c "
import os
from utils.meta_ads import spy
result = spy('네이버')  # 테스트
print(result[:500])
"
```

## 에이전트별 자동 실행

### 박탐정.py (타겟 소상공인 잠재고객 분석)

**자동 실행 조건**: task에 "경쟁", "경쟁사", "분석", "비교" 등 포함

**동작**:
1. `spy(경쟁사명)` → 경쟁사 광고 수집
2. `find_gaps([경쟁사목록])` → 틈새 찾기
3. Claude로 분석 결과 통합

**예시**:
```python
context = {
    'task': '카페 시장에서 경쟁사 분석하고 우리 타겟팅 전략 수립해줘'
}
# 자동으로 spy + find_gaps 실행 후 분석 결과 포함
```

### 이진단.py (온라인 현황 진단서)

**자동 실행 조건**: task에 "광고", "계정", "감사", "ads" 등 포함

**동작**:
1. `audit(계정정보)` → 186가지 기준으로 감사
2. 진단서에 감사 결과 포함
3. 개선안 제시

**예시**:
```python
context = {
    'task': '우리 네이버 광고 계정 현황 진단해줘'
}
# 자동으로 audit() 실행
```

### 최도현.py (퍼포먼스 광고 카피)

**자동 실행 조건**: task에 "카피", "카피라이팅", "광고문", "소재" 등 포함

**동작**:
1. `generate_copy(상품, 타겟, pain_point)` → 3가지 버전 생성
2. `score(카피, 타겟)` → 각 카피 0-100점 평가
3. 80점 이상만 납품 추천

**예시**:
```python
context = {
    'task': '미용실 영업용 카피라이팅 3가지 버전 만들어줘',
    'product': '매직스트레이트 시술',
    'target': '30-50대 여성',
    'pain_point': '자연스러운 매직 찾기 어려움'
}
# 자동으로 generate_copy + score 실행
```

## 문제 해결

### "Meta API 키 필요" 메시지

→ META_ACCESS_TOKEN이 .env에 설정되지 않았습니다.
위의 "필수 설정" 섹션을 따라주세요.

### "네트워크 오류" 또는 타임아웃

→ 인터넷 연결 확인 또는 토큰 유효성 확인
```bash
curl -X GET "https://graph.facebook.com/v21.0/ads_archive?access_token=YOUR_TOKEN&search_terms=test&limit=1"
```

### API 응답 403 또는 401

→ 토큰 권한 부족
- Meta Business Suite에서 토큰 재발급
- 필수 권한 확인: `ads:read`, `business_management`

## 사용 예시

### CLI에서 직접 사용

```bash
cd lian_company
./venv/Scripts/python.exe utils/meta_ads.py
```

테스트 함수들이 자동으로 실행됩니다.

### Python 코드에서 임포트

```python
from utils.meta_ads import spy, find_gaps, generate_copy, audit, score

# 1. 경쟁사 광고 수집
result = spy('네이버')
print(result)

# 2. 경쟁사 틈새 찾기
result = find_gaps(['네이버', '구글', '카카오'])
print(result)

# 3. 광고 카피 생성
result = generate_copy(
    product='AI 마케팅',
    target='소상공인',
    pain_point='시간 부족'
)
print(result)

# 4. 광고 계정 감사
result = audit('계정 정보 텍스트')
print(result)

# 5. 카피 점수 평가
result = score(
    ad_copy='지금 50% 할인! 지금 구매하기',
    target='20대 여성'
)
print(result)
```

## API 레이트 제한

Meta Ad Library API 레이트 제한:
- **200 calls/hour** (표준)
- **1000 calls/hour** (승인 후)

과도한 호출 시 요청이 거부될 수 있습니다.

## 성능 및 비용

- **Meta Ad Library API**: 무료
- **Claude API**: 토큰 기반 비용 (text-sonnet-4-5 기준)
  - spy: 약 500-1000 입력 토큰
  - find_gaps: 약 1000-2000 입력 토큰
  - generate_copy: 약 500 입력 토큰
  - audit: 약 1000-1500 입력 토큰
  - score: 약 500 입력 토큰

## 다음 단계

1. .env에 META_ACCESS_TOKEN 추가
2. 에이전트 실행 시 자동으로 Meta Ads 분석 포함
3. 보고사항들.md에 결과 자동 기록

---

**문의**: 설정 관련 문제 발생 시 lian_company/META_ADS_SETUP.md 다시 확인
