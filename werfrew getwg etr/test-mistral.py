import requests

def query_ollama(prompt):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "tinyllama",
        "prompt": prompt,
        "stream": True
    }

    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json()["response"]
    else:
        return f"Error: {response.status_code} - {response.text}"

def chatbot():
    print("🤖 TinyLLaMA Chatbot (type 'exit' to quit)")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Bot: Goodbye!")
            break
        bot_response = query_ollama(user_input)
        print("Bot:", bot_response)

if __name__ == "__main__":
    chatbot()