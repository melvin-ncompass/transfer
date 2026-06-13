import os
import pandas as pd
from lida import Manager, llm

# 🔑 Set your OpenAI API key
os.environ["OPENAI_API_KEY"] = "    "  # Replace with your actual key

# 🚀 Initialize LIDA with OpenAI
lida = Manager(text_gen=llm("openai"))

# 📁 Function to read code files from the repo
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
                            "filename": full_path,
                            "code": content
                        })
                except Exception as e:
                    print(f"⚠️ Skipped {full_path}: {e}")
    return pd.DataFrame(code_entries)

# 📥 Prompt for repo path
repo_path = input("📂 Enter the full path to your GitHub repo folder: ").strip()

# 🧾 Read code files into a DataFrame
code_df = read_code_files(repo_path)

if code_df.empty:
    print("🚫 No supported code files found in the repo.")
    exit()

# 🧠 Summarize the codebase
try:
    summary = lida.summarize(code_df)
    print("\n📄 High-Level Summary:\n", summary)
except Exception as e:
    print(f"❌ Failed to summarize codebase: {e}")
    exit()

# 🎯 Generate deeper-level goals
try:
    goals = lida.goals(summary, n=3)
    for i, goal in enumerate(goals):
        # Try accessing goal text safely
        goal_text = getattr(goal, "goal", None) or getattr(goal, "description", None) or str(goal)
        print(f"\n🔍 Goal {i+1}: {goal_text}")
except Exception as e:
    print(f"❌ Failed to generate goals: {e}")
    exit()

# 📊 Generate chart code for first goal
try:
    first_goal_text = getattr(goals[0], "goal", None) or getattr(goals[0], "description", None) or str(goals[0])
    charts = lida.visualize(summary=summary, goal=first_goal_text)
    print("\n📊 Chart Code:\n", charts[0]["chart_code"])
except Exception as e:
    print(f"❌ Failed to generate chart: {e}")
    exit()

# 💾 Save outputs
try:
    with open("summary.txt", "w", encoding="utf-8") as f:
        f.write(str(summary))
    with open("chart_code.js", "w", encoding="utf-8") as f:
        f.write(charts[0]["chart_code"])
    print("\n💾 Outputs saved to summary.txt and chart_code.js")
except Exception as e:
    print(f"⚠️ Failed to save outputs: {e}")