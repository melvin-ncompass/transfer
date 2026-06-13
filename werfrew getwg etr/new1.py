import os
import pandas as pd
import webbrowser
import re
import zlib
import base64
from lida import Manager, llm

# 🔑 Set your OpenAI API key (replace with yours if needed)
# API key removed for security — set it in your environment instead:
#   Windows (PowerShell):  $env:OPENAI_API_KEY="<your-key>"
#   macOS/Linux:           export OPENAI_API_KEY="<your-key>"  

# 🚀 Initialize LIDA with OpenAI
lida = Manager(text_gen=llm("openai"))

# 📁 Function to read code files
def read_code_files(repo_path):
    supported_extensions = [".ts", ".js", ".json"]
    code_entries = []
    for root, dirs, files in os.walk(repo_path):
        if any(skip in root for skip in ["node_modules", "dist", ".git"]):
            continue
        for file in files:
            if any(file.endswith(ext) for ext in supported_extensions):
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        code_entries.append({
                            "filename": os.path.relpath(full_path, repo_path),
                            "code": content
                        })
                except Exception as e:
                    print(f"⚠️ Skipped {full_path}: {e}")
    return pd.DataFrame(code_entries)

# 🧩 Generate Mermaid dependency graph
def generate_dependency_mermaid(data):
    mermaid_lines = ["graph TD"]
    for _, row in data.iterrows():
        print(row.keys())
        filename = row["filename"]
        code = row["code"]

        # ES6 imports
        imports = re.findall(r'import\s+.*?\s+from\s+[\'"](.+?)[\'"]', code)
        # CommonJS requires
        requires = re.findall(r'require\([\'"](.+?)[\'"]\)', code)

        for dep in imports + requires:
            dep_path = dep.replace("./", "").replace("../", "")
            mermaid_lines.append(f'    "{filename}" --> "{dep_path}"')

    return "\n".join(mermaid_lines)

# 📥 Repo path input
repo_path = input("📂 Enter full path to your repo: ").strip()

# 🧾 Read code
code_df = read_code_files(repo_path)
if code_df.empty:
    print("🚫 No supported code files found in the repo.")
    exit()

# 🧠 Summarize repo
try:
    summary = lida.summarize(code_df)
    # print("\n📄 High-Level Summary:\n", summary)
except Exception as e:
    print(f"❌ Summarization failed: {e}")
    summary = None

# 🎯 Goals (optional)
try:
    if summary:
        goals = lida.goals(summary, n=3)
        for i, goal in enumerate(goals):
            goal_text = getattr(goal, "goal", None) or getattr(goal, "description", None) or str(goal)
            print(f"\n🔍 Goal {i+1}: {goal_text}")
except Exception as e:
    print(f"⚠️ Goals step failed: {e}")

# 📊 Dependency chart only (ignore broken LIDA chart code)
chart_code = generate_dependency_mermaid(code_df)

# 💾 Save outputs
with open("summary.txt", "w", encoding="utf-8") as f:
    f.write(str(summary))
with open("chart_code.mmd", "w", encoding="utf-8") as f:
    f.write(chart_code)
print("\n💾 Saved: summary.txt and chart_code.mmd")

# 🌐 Open Mermaid Live Editor
try:
    compressed = zlib.compress(chart_code.encode("utf-8"), 9)
    compressed = compressed[2:-4]  # strip zlib headers
    encoded = base64.urlsafe_b64encode(compressed).decode("utf-8")

    mermaid_url = f"https://mermaid.live/edit#pako:{encoded}"
    print("🌐 Opening Mermaid Live Editor...")
    webbrowser.open(mermaid_url)
except Exception as e:
    print(f"⚠️ Mermaid Live link failed: {e}")
    print("👉 Copy chart_code.mmd into https://mermaid.live manually.")
