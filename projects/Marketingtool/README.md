# Setup Guide

Marketing Tool 설치 및 설정 가이드입니다.

---

## 📋 설치 순서

### 1. Backend 설치

```bash
# 1. 백엔드 폴더로 이동
cd C:\Users\lian1\Documents\Work\Marketingtool\backend

# 2. Python 가상 환경 생성
python -m venv venv

# 3. 가상 환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. 의존성 설치
pip install -r requirements.txt

# 5. 환경 변수 설정
cp .env.example .env.local
```

### 2. Frontend 설치

```bash
# 1. 프론트엔드 폴더로 이동
cd C:\Users\lian1\Documents\Work\Marketingtool\frontend

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
```

---

## ⚙️ 환경 변수 설정

### Backend (.env.local)

```bash
# 필수 설정
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
NAVER_DATA_LAB_KEY=your_data_lab_key_here

# 선택사항 (API 키가 없으면 자동으로 처리)
KEYWORD_TOOL_API_KEY=

# 서버 설정 (기본값)
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
PYTHON_ENV=development

# 데이터베이스 (선택사항)
DATABASE_URL=postgresql://user:password@localhost:5432/marketingtool
```

### Frontend (.env.local)

```bash
# 백엔드 API URL (개발 환경)
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 앱 이름
NEXT_PUBLIC_APP_NAME=Marketing Tool

# 환경
NODE_ENV=development
```

---

## 🔑 네이버 API 키 발급 방법

1. [네이버 개발자 센터](https://developers.naver.com/) 접속
2. "애플리케이션" → "애플리케이션 등록" 클릭
3. 애플리케이션 등록
4. "Client ID"와 "Client Secret" 발급
5. "검색 광고 API" → "데이터랩" 서비스 이용 신청
6. "Data Lab Client ID" 발급

---

## 🚀 서버 실행

### Backend 실행

```bash
# 백엔드 폴더에서
cd C:\Users\lian1\Documents\Work\Marketingtool\backend

# 가상 환경 활성화 후
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend가 실행되면:
- http://localhost:8000 접속
- API 문서: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Frontend 실행

```bash
# 프론트엔드 폴더에서
cd C:\Users\lian1\Documents\Work\Marketingtool\frontend

# 개발 서버 실행
npm run dev
```

Frontend가 실행되면:
- http://localhost:3000 접속

---

## 🧪 첫 실행 테스트

1. 브라우저에서 http://localhost:3000 접속
2. 업체명에 "강남 양주 축구교실" 또는 실제 테스트할 업체명 입력
3. "분석 시작" 버튼 클릭
4. 분석 완료까지 대기
5. 결과 확인

---

## ⚠️ 일반적인 문제 해결

### Backend 관련

**문제**: Selenium 드라이버 연결 오류
```bash
# 해결: ChromeDriver 최신 버전 설치
# 또는 webdriver-manager 사용 (이미 requirements.txt에 포함됨)
```

**문제**: ImportError
```bash
# 해결: 가상 환경이 활성화되어 있는지 확인
which python
```

### Frontend 관련

**문제**: npm install 실패
```bash
# 해결: 캐시 삭제 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**문제**: TypeScript 에러
```bash
# 해결:
npm run lint
# 또는 VS Code에서 TypeScript 버전 확인
```

---

## 📞 추가 도움말

- Next.js 문서: https://nextjs.org/docs
- FastAPI 문서: https://fastapi.tiangolo.com/
- python-pptx 문서: https://python-pptx.readthedocs.io/
