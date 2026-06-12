import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

class GeminiSummarizer:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ GEMINI_API_KEY not found in environment variables.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-pro',
        )
        self.structured_model = genai.GenerativeModel('models/gemini-2.5-pro')
        self.model_name = "models/gemini-2.5-pro"
        print("✅ Gemini Service initialized.")


    def _summarize_chunk(self, text: str) -> str:
        prompt = f"""
You are an AI research assistant. Summarize the following section concisely,
focusing on key insights, methods, and findings.

--- TEXT START ---
{text}
--- TEXT END ---
"""
        try:
            response = self.structured_model.generate_content(prompt)
            cleaned_text = response.candidates[0].content.parts[0].text.strip()
            return cleaned_text
        except Exception as e:
            print("❌ Error during summarization:", e)
            return "Error summarizing this chunk."

    def summarize(self, text: str, chunk_size: int = 50000) -> str:
        """Automatically handles long text by chunking."""
        summaries = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i+chunk_size]
            print(f"🧩 Summarizing chunk {i//chunk_size + 1}...")
            summaries.append(self._summarize_chunk(chunk))

        print("\n🧠 Combining all chunk summaries...")
        final_summary = self._summarize_chunk(" ".join(summaries))
        return final_summary
