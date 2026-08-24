import os
import time

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class SummarizationError(RuntimeError):
    pass


class GeminiSummarizer:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        genai.configure(api_key=api_key)
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").removeprefix("models/")
        self.model = genai.GenerativeModel(
            self.model_name,
            generation_config={"temperature": 0.2, "max_output_tokens": 1800},
        )
        print(f"Gemini service initialized with {self.model_name}.")

    @staticmethod
    def _chunks(text, chunk_size=16_000):
        text = text.strip()
        while len(text) > chunk_size:
            boundary = max(
                text.rfind("\n\n", 0, chunk_size),
                text.rfind(". ", 0, chunk_size),
                text.rfind("\n", 0, chunk_size),
            )
            if boundary < chunk_size // 2:
                boundary = chunk_size
            else:
                boundary += 1
            yield text[:boundary].strip()
            text = text[boundary:].strip()
        if text:
            yield text

    def _generate(self, prompt, retries=3):
        for attempt in range(retries):
            try:
                response = self.model.generate_content(prompt)
                result = (getattr(response, "text", "") or "").strip()
                if not result:
                    raise SummarizationError("Gemini returned an empty response")
                return result
            except Exception as error:
                message = str(error).lower()
                transient = any(code in message for code in ("429", "500", "502", "503", "504", "timeout"))
                if transient and attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise SummarizationError(f"Gemini summarization failed: {error}") from error

    def _summarize_chunk(self, text):
        return self._generate(
            "You are a precise research assistant. Summarize the document section below. "
            "Preserve important names, numbers, methods, findings, limitations, and conclusions. "
            "Do not invent information. Use clear paragraphs and concise bullet points when useful.\n\n"
            f"DOCUMENT SECTION:\n{text}"
        )

    def summarize(self, text, chunk_size=16_000):
        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        chunks = list(self._chunks(text, chunk_size))
        summaries = [self._summarize_chunk(chunk) for chunk in chunks]
        if len(summaries) == 1:
            return summaries[0]

        combined = "\n\n".join(
            f"Section {index}:\n{summary}" for index, summary in enumerate(summaries, start=1)
        )
        return self._generate(
            "Combine the section summaries below into one coherent, non-repetitive final summary. "
            "Retain the document's key methods, evidence, findings, limitations, and conclusions. "
            "Do not add facts that are absent from the sections.\n\n"
            f"SECTION SUMMARIES:\n{combined}"
        )
