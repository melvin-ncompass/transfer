# Python Chatbot using Mistral API

This is a simple command-line chatbot that uses the Mistral API for conversation.

## Setup
1. Install dependencies:
   ```bash
   pip install requests
   ```
2. Set your Mistral API key as an environment variable:
   - On Windows PowerShell:
     ```powershell
     $env:MISTRAL_API_KEY = "your_api_key_here"
     ```
   - Or, you can enter it directly in the script (not recommended for production).

## Usage
Run the chatbot script:
```bash
python chatbot.py
```

## Security
Never share your API key publicly. Store it securely using environment variables.
