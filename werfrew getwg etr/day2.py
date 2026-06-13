import os
import pandas as pd
import webbrowser
import re
import zlib
import base64
from openai import OpenAI

# 🔑 Set your OpenAI API key (replace with yours or set via environment variable)
# API key removed for security — set it in your environment instead:
#   Windows (PowerShell):  $env:OPENAI_API_KEY="<your-key>"
#   macOS/Linux:           export OPENAI_API_KEY="<your-key>"
client = OpenAI()

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

# 🧩 Generate dependency graph in Mermaid
def generate_dependency_mermaid(data):
    mermaid_lines = ["flowchart TD"]
    for _, row in data.iterrows():
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
summary_text = code_df[["filename", "code"]].to_dict(orient="records")

print("\n📄 High-Level Summary Extracted (raw):\n", summary_text)

# 🎯 Generate Flowchart using OpenAI
flowchart_code = None
try:
    prompt = f"""
    You are a software architect. 
    Based on this repository summary:

    {summary_text}

    Generate a **detailed flowchart** in **Mermaid syntax (flowchart TD)** 
    that explains how the repository's main components interact. 
    Use decisions, processes, and terminators where necessary.
    Only output valid Mermaid code.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # lightweight & fast
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    flowchart_code = response.choices[0].message.content.strip()

    # Ensure it starts with flowchart TD
    if not flowchart_code.startswith("flowchart TD"):
        flowchart_code = "flowchart TD\n" + flowchart_code

    print("\n✅ Generated Flowchart:\n")
    print(flowchart_code)

except Exception as e:
    print(f"⚠️ Flowchart generation failed: {e}")

# 📊 Dependency chart (backup)
chart_code = generate_dependency_mermaid(code_df)

# 💾 Save outputs
with open("summary.txt", "w", encoding="utf-8") as f:
    f.write(str(summary_text))
if flowchart_code:
    with open("flowchart.mmd", "w", encoding="utf-8") as f:
        f.write(flowchart_code)
with open("chart_code.mmd", "w", encoding="utf-8") as f:
    f.write(chart_code)

print("\n💾 Saved: summary.txt, flowchart.mmd, and chart_code.mmd")

# 🌐 Open Mermaid Live Editor for flowchart (if generated)
if flowchart_code:
    try:
        compressed = zlib.compress(flowchart_code.encode("utf-8"), 9)
        compressed = compressed[2:-4]  # strip zlib headers
        encoded = base64.urlsafe_b64encode(compressed).decode("utf-8")

        mermaid_url = f"https://mermaid.live/edit#pako:{encoded}"
        print("🌐 Opening Mermaid Live Editor (Flowchart)...")
        webbrowser.open(mermaid_url)
    except Exception as e:
        print(f"⚠️ Mermaid Live link failed: {e}")
        print("👉 Copy flowchart.mmd into https://mermaid.live manually.")
