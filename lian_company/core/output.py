import os
from datetime import datetime


def create_output_dir(project_name: str) -> str:
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    safe_name = project_name[:30].replace("/", "_").replace("\\", "_").replace(" ", "_")
    dir_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "outputs",
        f"{timestamp}_{safe_name}"
    )
    os.makedirs(dir_path, exist_ok=True)
    return dir_path


def save_file(output_dir: str, filename: str, content: str) -> str:
    filepath = os.path.join(output_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath
