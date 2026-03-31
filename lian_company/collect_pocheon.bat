@echo off
chcp 65001 >nul
pushd "%~dp0projects\지역_소상공인_010번호_+_인스타\local_biz_collector"
venv\Scripts\python.exe run_headless.py 포천
popd
pause
