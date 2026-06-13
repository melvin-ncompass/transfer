import os
import requests

API_URL = "https://api.mistral.ai/v1/chat/completions"
API_KEY = os.getenv("MISTRAL_API_KEY")

if not API_KEY:
    API_KEY = input("Enter your Mistral API key: ").strip()

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_mistral_response(message):
    data = {
        "model": "mistral-tiny",
        "messages": [
            {"role": "user", "content": message}
        ]
    }
    response = requests.post(API_URL, headers=headers, json=data)
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"

if __name__ == "__main__":
    print("Mistral Chatbot. Type 'exit' to quit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        reply = get_mistral_response(user_input)
        print(f"dev: {reply}")
