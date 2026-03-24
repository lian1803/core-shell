@echo off
echo 불사자 시작 중... (자동화용)
taskkill /F /IM BULSAJA.exe 2>nul
timeout /t 2 /nobreak >nul
start "" "%LOCALAPPDATA%\Programs\bulsaja\BULSAJA.exe" --remote-debugging-port=9222
echo 불사자가 시작됩니다. 로그인 후 구매대행 자동화를 실행하세요.
