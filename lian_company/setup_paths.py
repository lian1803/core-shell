"""
install.bat에서 호출하는 경로 업데이트 스크립트
사용: python setup_paths.py <repo_dir>
"""
import sys
import os

repo = sys.argv[1].rstrip("\\").rstrip("/")
repo_fwd = repo.replace("\\", "/")

files = [
    os.path.join(repo, ".claude", "agents", "architect.md"),
    os.path.join(repo, ".claude", "agents", "coos.md"),
    os.path.join(repo, ".agents", "workflows", "run-lian.md"),
    os.path.join(repo, "CLAUDE.md"),
]

old_patterns = [
    "C:/Users/hkyou/Documents/work_youns/core-shell",
    "C:\\Users\\hkyou\\Documents\\work_youns\\core-shell",
    "C:/Users/lian1/Documents/Work/core",
    "C:\\Users\\lian1\\Documents\\Work\\core",
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = content
    for old in old_patterns:
        old_fwd = old.replace("\\", "/")
        new_content = new_content.replace(old_fwd, repo_fwd)
        new_content = new_content.replace(old, repo)
    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("  Updated: " + os.path.basename(fpath))
