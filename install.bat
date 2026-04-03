@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   리안 컴퍼니 설치 스크립트
echo ============================================================
echo.

:: ── 현재 경로 감지 ───────────────────────────────────────────
set "REPO_DIR=%~dp0"
set "REPO_DIR=!REPO_DIR:~0,-1!"
echo   설치 경로: !REPO_DIR!
echo.

:: ── Node.js 확인 ─────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 없어.
    echo        https://nodejs.org 에서 LTS 설치 후 다시 실행해줘.
    start https://nodejs.org
    pause
    exit /b 1
)
echo [1/7] Node.js 확인 완료

:: ── Python 확인 ──────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 없어.
    echo        https://www.python.org 에서 Python 3.11 이상 설치 후 다시 실행해줘.
    echo        설치 시 "Add Python to PATH" 반드시 체크!
    start https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [2/7] Python 확인 완료

:: ── Claude Code 설치 ─────────────────────────────────────────
echo [3/7] Claude Code 설치 중...
call npm install -g @anthropic/claude-code >nul 2>&1
if errorlevel 1 (
    echo [오류] Claude Code 설치 실패. 관리자 권한으로 다시 실행해봐.
    pause
    exit /b 1
)
echo       완료

:: ── venv 생성 + 패키지 설치 ──────────────────────────────────
if not exist "!REPO_DIR!\lian_company\venv" (
    echo [4/7] 가상환경 생성 중...
    python -m venv "!REPO_DIR!\lian_company\venv"
) else (
    echo [4/7] 가상환경 이미 존재함 — 스킵
)
echo       패키지 설치 중...
"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -m pip install --upgrade pip -q
"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -m pip install -r "!REPO_DIR!\lian_company\requirements.txt" -q
echo       완료

:: ── 경로 자동 업데이트 ───────────────────────────────────────
echo [5/7] 설정 파일 경로 업데이트 중...
set "PYTHON_PATH=!REPO_DIR!\lian_company\venv\Scripts\python.exe"
set "PYTHON_FWD=!PYTHON_PATH:\=/!"
set "REPO_FWD=!REPO_DIR:\=/!"

"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -c "
import re, sys

repo = sys.argv[1]
python = sys.argv[2]

files = [
    (r'!REPO_DIR!\.claude\settings.json', False),
    (r'!REPO_DIR!\.claude\agents\architect.md', False),
    (r'!REPO_DIR!\.claude\agents\coos.md', False),
    (r'!REPO_DIR!\.claude\commands\save.md', False),
    (r'!REPO_DIR!\.claude\commands\self-review.md', False),
    (r'!REPO_DIR!\.claude\commands\trend.md', False),
    (r'!REPO_DIR!\.agents\workflows\run-lian.md', False),
]

old_paths = [
    r'C:/Users/hkyou/Documents/work_youns/core-shell',
    r'C:\\Users\\hkyou\\Documents\\work_youns\\core-shell',
    r'c:\\Users\\hkyou\\Documents\\work_youns\\core-shell',
    r'c:/Users/hkyou/Documents/work_youns/core-shell',
]

for fpath, _ in files:
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = content
        for old in old_paths:
            new_slash = repo.replace(chr(92), '/')
            old_slash = old.replace(chr(92), '/')
            new_content = new_content.replace(old_slash, new_slash)
            new_content = new_content.replace(old_slash.replace('/', chr(92)), repo)
        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'  업데이트: {fpath}')
    except Exception as e:
        print(f'  스킵: {fpath} ({e})')
" "!REPO_DIR!" "!PYTHON_PATH!"

echo       완료

:: ── Claude Code 글로벌 설정 ──────────────────────────────────
echo [6/7] Claude Code 기본 설정 중...
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
if not exist "%USERPROFILE%\.claude\settings.json" (
    (
        echo {
        echo   "skipDangerousModePermissionPrompt": true,
        echo   "model": "sonnet"
        echo }
    ) > "%USERPROFILE%\.claude\settings.json"
    echo       완료
) else (
    echo       이미 설정됨 — 스킵
)

:: ── .env 파일 생성 ────────────────────────────────────────────
echo [7/7] API 키 설정
echo.

if exist "!REPO_DIR!\lian_company\.env" (
    echo   .env 파일이 이미 있어. 덮어쓸까? (y/n, 기본값=n):
    set /p OVERWRITE=  선택:
    if /i not "!OVERWRITE!"=="y" goto :done
)

echo.
echo   ※ Anthropic 키는 필수야. 나머지는 없으면 그냥 엔터.
echo.

set /p OWNER=  이름 (예: 리안):
set /p ANTHROPIC=  Anthropic API 키 (필수, sk-ant-...):

if "!ANTHROPIC!"=="" (
    echo.
    echo [오류] Anthropic API 키는 필수야. 다시 실행해줘.
    pause
    exit /b 1
)

set /p OPENAI=  OpenAI API 키 (없으면 엔터):
set /p GOOGLE=  Google API 키 (없으면 엔터):
set /p PERPLEXITY=  Perplexity API 키 (없으면 엔터):
set /p DISCORD=  Discord Webhook URL (없으면 엔터):

(
    echo OWNER_NAME=!OWNER!
    echo.
    echo ANTHROPIC_API_KEY=!ANTHROPIC!
    echo OPENAI_API_KEY=!OPENAI!
    echo GOOGLE_API_KEY=!GOOGLE!
    echo PERPLEXITY_API_KEY=!PERPLEXITY!
    echo.
    echo DISCORD_WEBHOOK_URL=!DISCORD!
    echo.
    echo CLOUDFLARE_API_TOKEN=
    echo CLOUDFLARE_ACCOUNT_ID=
    echo CF_PROJECT_NAME=
    echo PROJECT_URL=
    echo STITCH_API_KEY=
) > "!REPO_DIR!\lian_company\.env"

echo.
echo   .env 저장 완료

:: ── 완료 ──────────────────────────────────────────────────────
:done
echo.
echo ============================================================
echo   설치 완료!
echo.
echo   실행 방법:
echo     1. 이 폴더에서 터미널 열기 (우클릭 - 터미널에서 열기)
echo     2. claude 입력
echo ============================================================
echo.
pause
