# 디스코드 봇 설정 가이드

리안 컴퍼니 자동화 시스템을 디스코드에서 직접 제어하는 봇입니다.

## 1단계: 디스코드 개발자 포털에서 봇 생성

### 1-1. 애플리케이션 생성
1. https://discord.com/developers/applications 접속
2. "New Application" 클릭
3. 앱 이름 입력 (예: "리안 컴퍼니 봇")
4. 생성 완료

### 1-2. 봇 생성
1. 왼쪽 메뉴 → "Bot" 클릭
2. "Add Bot" 클릭
3. 봇이 생성됨

### 1-3. 봇 토큰 복사
1. "Bot" 섹션에서 "TOKEN" 우측 "Copy" 클릭
2. 복사한 토큰을 `.env`에 저장:
   ```
   DISCORD_BOT_TOKEN=복사한_토큰
   ```

## 2단계: 봇 권한 설정

### 2-1. Intents 활성화
1. 개발자 포털 → 봇 설정 페이지
2. "Intents" 섹션에서 아래 2개 활성화:
   - ✅ **PRESENCE INTENT**
   - ✅ **MESSAGE CONTENT INTENT** (중요!)
   - ✅ **SERVER MEMBERS INTENT**

### 2-2. 봇 권한 설정
1. 개발자 포털 → "OAuth2" → "URL Generator"
2. **Scopes** 선택:
   - ✅ `bot`
3. **Permissions** 선택:
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Read Messages/View Channels
   - ✅ Embed Links
   - ✅ Attach Files

### 2-3. 초대 URL 생성
1. "URL Generator"에서 생성된 URL을 복사
2. 브라우저에서 접속 → 봇을 추가할 서버 선택 → 봇 추가

## 3단계: 리안의 유저 ID 확인 (보안)

### 3-1. 리안 유저 ID 찾기
1. 디스코드 → 설정 → "고급"
2. "개발자 모드" 활성화
3. 리안 프로필 우클릭 → "사용자 ID 복사"
4. `.env`에 저장:
   ```
   DISCORD_LIAN_USER_ID=복사한_ID
   ```

### 3-2. (선택) 채널 ID 찾기
특정 채널에서만 명령을 받으려면:
1. 해당 채널 우클릭 → "채널 ID 복사"
2. `.env`에 저장:
   ```
   DISCORD_CHANNEL_ID=복사한_ID
   ```

## 4단계: 봇 실행

```bash
cd "C:/Users/lian1/Documents/Work/core/lian_company"
./venv/Scripts/python.exe discord_bot.py
```

성공하면:
```
✅ 봇 로그인: YourBotName#0000
   리안 ID: 123456789012345678
   채널 ID: (미설정 — 모든 채널)
```

## 5단계: 리안이 사용하기

디스코드에서 봇이 있는 채널에 다음 명령들을 입력:

| 명령 | 동작 |
|------|------|
| `이사팀 {아이디어}` | 이사팀 소집 (기획 실행) |
| `{아이디어} 해볼까` | 이사팀 소집 (기획 실행) |
| `영업 {태스크}` | 온라인영업팀 실행 |
| `납품 {태스크}` | 온라인납품팀 실행 |
| `마케팅 {태스크}` | 온라인마케팅팀 실행 |
| `오프라인 {태스크}` | 오프라인마케팅팀 실행 |
| `데일리` | 일일 자동 루프 |
| `상태` | 현재 실행 상태 조회 |
| `보고` | 최신 보고사항 조회 |

## 예시

```
리안: 이사팀 AI 기반 이력서 자동 생성 서비스
봇: 🚀 실행 시작: 이사팀 소집: AI 기반 이력서 자동 생성 서비스
    (잠깐 기다렸다가)
봇: ✅ 실행 완료
    → 보고사항들.md 확인해

리안: 영업 우리 새 SaaS 제품 자료
봇: 🚀 실행 시작: 온라인영업팀: 우리 새 SaaS 제품 자료
    (실행 중...)
봇: ✅ 실행 완료
    → 보고사항들.md 확인해
```

## 문제 해결

### 봇이 메시지에 응답 안 함
- [ ] DISCORD_BOT_TOKEN이 .env에 설정됐나?
- [ ] MESSAGE CONTENT INTENT가 활성화됐나?
- [ ] 봇이 채널에 메시지 보낼 권한이 있나?
- [ ] DISCORD_LIAN_USER_ID가 설정돼 있으면, 맞는 리안 ID인가?

### 토큰 에러
```
Invalid token
```
- [ ] 토큰을 올바르게 복사했나?
- [ ] 토큰 앞에 공백은 없나?

### 권한 에러
```
Missing Permissions
```
- [ ] 봇이 서버에 제대로 추가됐나?
- [ ] 봇의 역할(Role)이 메시지 보낼 권한을 가지고 있나?

## 보안 주의

- **DISCORD_BOT_TOKEN**: 절대 공개하지 마세요. Github에 커밋하지 마세요.
- **DISCORD_LIAN_USER_ID**: 설정하면 리안만 명령할 수 있습니다 (권장).
- `.env` 파일은 `.gitignore`에 포함돼 있으므로 자동으로 버전관리에서 제외됩니다.

## 자동 실행 설정 (선택)

Windows에서 봇을 자동 실행하려면:

### 작업 스케줄러 설정
1. Windows 검색 → "작업 스케줄러" 실행
2. 우측 "기본 작업 만들기..."
3. 이름: "Lian Company Discord Bot"
4. 트리거: "시스템 시작 시"
5. 동작:
   - 프로그램: `C:/Users/lian1/Documents/Work/core/lian_company/venv/Scripts/python.exe`
   - 인수: `discord_bot.py`
   - 시작 위치: `C:/Users/lian1/Documents/Work/core/lian_company`
6. 저장

이제 PC 시작 시 봇이 자동으로 실행됩니다.

## 지원

문제가 있으면:
1. discord_bot.py 파일에서 로그 메시지 확인
2. 콘솔 출력을 저장하고 검토

