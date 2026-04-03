@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   Lian Company - Setup Script
echo ============================================================
echo.

:: Detect current directory
set "REPO_DIR=%~dp0"
set "REPO_DIR=!REPO_DIR:~0,-1!"
echo   Path: !REPO_DIR!
echo.

:: Node.js check
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo         Install LTS from https://nodejs.org and run again.
    start https://nodejs.org
    pause
    exit /b 1
)
echo [1/6] Node.js OK

:: Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found.
    echo         Install Python 3.11+ from https://www.python.org
    echo         Check "Add Python to PATH" during install!
    start https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [2/6] Python OK

:: Claude Code install
claude --version >nul 2>&1
if not errorlevel 1 (
    echo [3/6] Claude Code already installed - skip
    goto :venv
)
echo [3/6] Installing Claude Code...
call npm install -g @anthropic/claude-code
if errorlevel 1 (
    echo.
    echo [ERROR] Claude Code install failed.
    echo         Try: npm install -g @anthropic/claude-code
    pause
    exit /b 1
)
echo       Done
:venv

:: venv + packages
if not exist "!REPO_DIR!\lian_company\venv" (
    echo [4/6] Creating Python venv...
    python -m venv "!REPO_DIR!\lian_company\venv"
) else (
    echo [4/6] venv already exists - skip
)
echo       Installing packages...
"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -m pip install --upgrade pip -q
"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -m pip install -r "!REPO_DIR!\lian_company\requirements.txt" -q
echo       Done

:: Update config paths
echo [5/6] Updating config paths...
"!REPO_DIR!\lian_company\venv\Scripts\python.exe" -c "
import sys, os

repo = sys.argv[1]

files = [
    os.path.join(repo, '.claude', 'agents', 'architect.md'),
    os.path.join(repo, '.claude', 'agents', 'coos.md'),
    os.path.join(repo, '.agents', 'workflows', 'run-lian.md'),
]

old_patterns = [
    'C:/Users/hkyou/Documents/work_youns/core-shell',
    r'C:\Users\hkyou\Documents\work_youns\core-shell',
    'C:/Users/lian1/Documents/Work/core',
    r'C:\Users\lian1\Documents\Work\core',
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content
    repo_fwd = repo.replace(chr(92), '/')
    for old in old_patterns:
        old_fwd = old.replace(chr(92), '/')
        new_content = new_content.replace(old_fwd, repo_fwd)
        new_content = new_content.replace(old, repo)
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('  Updated: ' + os.path.basename(fpath))
" "!REPO_DIR!"
echo       Done

:: API keys
echo [6/6] API Key Setup
echo.

if exist "!REPO_DIR!\lian_company\.env" (
    echo   .env already exists. Overwrite? (y/n, default=n):
    set /p OVERWRITE=  >
    if /i not "!OVERWRITE!"=="y" goto :done
)

echo.
echo   Anthropic key is required. Others are optional (press Enter to skip).
echo.

set /p OWNER=  Your name (e.g. Lian):
set /p ANTHROPIC=  Anthropic API key (required, sk-ant-...):

if "!ANTHROPIC!"=="" (
    echo.
    echo [ERROR] Anthropic API key is required. Run again.
    pause
    exit /b 1
)

set /p OPENAI=  OpenAI API key (optional):
set /p GOOGLE=  Google API key (optional):
set /p PERPLEXITY=  Perplexity API key (optional):
set /p DISCORD=  Discord Webhook URL (optional):

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
echo   .env saved

:done
echo.
echo ============================================================
echo   Setup complete!
echo.
echo   How to run:
echo     1. Open terminal in this folder
echo     2. Type: claude
echo ============================================================
echo.
pause
