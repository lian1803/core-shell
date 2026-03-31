@echo off
chcp 65001 >nul
echo.
echo ================================================
echo     LIAN COMPANY 설치 시작
echo ================================================
echo.

:: Node.js 체크
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js가 없어요.
    echo     https://nodejs.org 에서 LTS 버전 설치 후 다시 실행해주세요.
    start https://nodejs.org
    pause
    exit /b 1
)
echo [v] Node.js 확인

:: Python 체크
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python이 없어요.
    echo     https://www.python.org 에서 설치 후 다시 실행해주세요.
    echo     설치 시 "Add Python to PATH" 반드시 체크!
    start https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [v] Python 확인

:: Claude Code 설치
echo.
echo [1/4] Claude Code 설치 중...
call npm install -g @anthropic/claude-code
if %errorlevel% neq 0 (
    echo [!] Claude Code 설치 실패. 관리자 권한으로 실행해보세요.
    pause
    exit /b 1
)
echo [v] Claude Code 설치 완료

:: Python 패키지 설치
echo.
echo [2/4] Python 패키지 설치 중...
cd lian_company
python -m venv venv
call venv\Scripts\activate
pip install anthropic openai google-genai python-dotenv requests >nul 2>&1
call venv\Scripts\deactivate
cd ..
echo [v] Python 패키지 설치 완료

:: 글로벌 Claude 설정
echo.
echo [3/4] Claude Code 설정 중...
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
echo { > "%USERPROFILE%\.claude\settings.json"
echo   "skipDangerousModePermissionPrompt": true, >> "%USERPROFILE%\.claude\settings.json"
echo   "model": "sonnet" >> "%USERPROFILE%\.claude\settings.json"
echo } >> "%USERPROFILE%\.claude\settings.json"
echo [v] Claude Code 설정 완료

:: .env 파일 생성
echo.
echo [4/4] API 키 설정
echo ================================================
echo  아래 키들을 하나씩 입력해주세요.
echo  없는 키는 그냥 엔터 누르면 건너뜁니다.
echo ================================================
echo.

set /p ANTHROPIC_KEY="Anthropic API 키 (필수): "
set /p OPENAI_KEY="OpenAI API 키 (GPT-4o용): "
set /p GOOGLE_KEY="Google API 키 (Gemini용): "
set /p PERPLEXITY_KEY="Perplexity API 키: "
set /p MINIMAX_KEY="MiniMax API 키 (없으면 엔터): "

echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY% > lian_company\.env
echo OPENAI_API_KEY=%OPENAI_KEY% >> lian_company\.env
echo GOOGLE_API_KEY=%GOOGLE_KEY% >> lian_company\.env
echo PERPLEXITY_API_KEY=%PERPLEXITY_KEY% >> lian_company\.env
echo MINIMAX_API_KEY=%MINIMAX_KEY% >> lian_company\.env

echo [v] .env 파일 생성 완료

:: 완료
echo.
echo ================================================
echo  설치 완료!
echo.
echo  사용법:
echo  1. 이 폴더에서 마우스 오른쪽 클릭
echo  2. "터미널에서 열기" 클릭
echo  3. claude 입력 후 엔터
echo ================================================
echo.
pause
