import os
import base64
import webbrowser

# 📁 Read code files from repo
def read_code_files(repo_path):
    supported_extensions = [".ts", ".js", ".json"]
    code_entries = []
    for root, dirs, files in os.walk(repo_path):
        if any(skip in root for skip in ["node_modules", "dist", ".git"]):
            continue
        for file in files:
            if any(file.endswith(ext) for ext in supported_extensions):
                full_path = os.path.join(root, file)
                code_entries.append(full_path)
    return code_entries

# 🧠 Generate Mermaid flowchart
def generate_mermaid_architecture(file_paths):
    mermaid_lines = ["graph TD"]
    for path in file_paths:
        parts = path.replace("\\", "/").split("/")
        for i in range(len(parts) - 1):
            parent = parts[i]
            child = parts[i + 1]
            mermaid_lines.append(f"{parent} --> {child}")
    return "\n".join(sorted(set(mermaid_lines)))

# 📥 Get repo path
repo_path = input("📂 Enter the full path to your GitHub repo folder: ").strip()

# 🧾 Read files
code_files = read_code_files(repo_path)
if not code_files:
    print("🚫 No supported code files found.")
    exit()

# 🧠 Generate chart
chart_code = generate_mermaid_architecture(code_files)

# 💾 Save to .mmd file
with open("architecture.mmd", "w", encoding="utf-8") as f:
    f.write(chart_code)
print("✅ Saved architecture.mmd")

# 🌐 Encode and open in Mermaid Live Editor
encoded = base64.urlsafe_b64encode(chart_code.encode("utf-8")).decode("utf-8")
mermaid_url = f"https://mermaid.live/edit#{encoded}"
print("🌐 Opening Mermaid Live Editor...")
webbrowser.open(mermaid_url)
