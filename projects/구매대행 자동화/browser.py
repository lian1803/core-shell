# -*- coding: utf-8 -*-
"""브라우저: Chrome 경로, 프로세스 종료."""

import os
import subprocess
from pathlib import Path


def kill_chrome_hard() -> None:
    subprocess.run(
        ["taskkill", "/F", "/T", "/IM", "chrome.exe"],
        capture_output=True,
        text=True,
    )


def get_chrome_exe() -> str | None:
    pf = os.environ.get("ProgramFiles", r"C:\Program Files")
    chrome = Path(pf) / "Google" / "Chrome" / "Application" / "chrome.exe"
    if chrome.exists():
        return str(chrome)
    local = Path(os.environ["LOCALAPPDATA"]) / "Google" / "Chrome" / "Application" / "chrome.exe"
    if local.exists():
        return str(local)
    return None
