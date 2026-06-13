import requests

API_KEY = input("Enter your Gemini API key: ").strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = requests.get(url)

if response.status_code != 200:
    print(f"Error {response.status_code}: {response.text}")
else:
    models = response.json().get("models", [])
    image_models = []
    other_models = []

    for model in models:
        name = model.get("name", "")
        display = model.get("displayName", "")
        methods = model.get("supportedGenerationMethods", [])

        if "image" in name.lower() or "imagen" in name.lower():
            image_models.append((name, display, methods))
        else:
            other_models.append((name, display, methods))

    print(f"\nTotal models found: {len(models)}\n")

    if image_models:
        print("=== IMAGE-RELATED MODELS ===")
        for name, display, methods in image_models:
            print(f"  Name:    {name}")
            print(f"  Display: {display}")
            print(f"  Methods: {', '.join(methods)}")
            print()

    print("=== ALL OTHER MODELS ===")
    for name, display, methods in other_models:
        print(f"  Name:    {name}")
        print(f"  Display: {display}")
        print(f"  Methods: {', '.join(methods)}")
        print()
