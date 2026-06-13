from lida import Manager
from lida.datamodel import Goal

# Step 1: Initialize LIDA Manager
lida = Manager()

# Step 2: Load your data
file_path = "your_data.csv"  # Replace with your actual CSV file path
df = lida.load_data(file_path)

# Step 3: Generate goals
goals = lida.goals(df)

# Step 4: Display goals properly using dot notation
for i, goal in enumerate(goals):
    print(f"\n🎯 Goal {i+1}: {goal.goal}")

# Optional: Generate charts for each goal
for i, goal in enumerate(goals):
    charts = lida.visualize(goal=goal, df=df)
    print(f"\n📊 Charts for Goal {i+1}:")
    for chart in charts:
        print(f"- {chart.text}")