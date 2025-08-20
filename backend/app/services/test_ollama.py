import requests
import json

url = "http://localhost:11434/api/generate"

payload = {
    "model": "llama3",
    "prompt": "Generate one question and answer about the water cycle. Respond ONLY with raw JSON in the format: {\"question\": \"...\", \"answer\": \"...\"}",
    "stream": False
}

try:
    response = requests.post(url, json=payload)
    response.raise_for_status()  # Raise error for bad HTTP status codes
    data = response.json()
    print("✅ Response from Ollama:\n")
    print(data["response"])
except requests.exceptions.RequestException as e:
    print("❌ Request failed:", e)
except KeyError:
    print("❌ Unexpected response format:", response.text)
