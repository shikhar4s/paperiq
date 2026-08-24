import os
import re
import time
from collections import Counter

import requests
from dotenv import load_dotenv

load_dotenv()


class SummarizationError(RuntimeError):
    pass


class GeminiSummarizer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured")

        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").removeprefix("models/")
        self.endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model_name}:generateContent"
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

    def _request_generation(self, prompt, retries=2):
        generation_config = {"temperature": 0.2, "maxOutputTokens": 4096}
        if getattr(self, "model_name", "gemini-3.6-flash").startswith("gemini-3"):
            generation_config["thinkingConfig"] = {"thinkingLevel": "minimal"}

        for attempt in range(retries):
            try:
                response = requests.post(
                    self.endpoint,
                    headers={"x-goog-api-key": self.api_key},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": generation_config,
                    },
                    timeout=(5, 20),
                )
                if not response.ok:
                    detail = response.json().get("error", {}).get("message", response.text)
                    raise SummarizationError(f"Google Gemini returned {response.status_code}: {detail}")
                payload = response.json()
                candidate = payload.get("candidates", [{}])[0]
                parts = candidate.get("content", {}).get("parts", [])
                result = "\n".join(
                    part.get("text", "") for part in parts if not part.get("thought", False)
                ).strip()
                if not result:
                    raise SummarizationError("Gemini returned an empty response")
                return result, candidate.get("finishReason", "STOP")
            except Exception as error:
                message = str(error).lower()
                transient = any(code in message for code in ("429", "500", "502", "503", "504", "timeout"))
                if transient and attempt < retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise SummarizationError(f"Gemini summarization failed: {error}") from error

    def _generate(self, prompt, retries=2):
        result, finish_reason = self._request_generation(prompt, retries)
        if finish_reason != "MAX_TOKENS":
            return result

        print("Gemini reached its output limit; completing the remaining document sections.")
        continuation, _ = self._request_generation(
            "Your previous summary stopped before it was finished. Continue immediately "
            "from its final words, without repeating completed sections. Cover all remaining "
            "parts of the original document and end with a complete sentence.\n\n"
            f"ORIGINAL REQUEST:\n{prompt}\n\n"
            f"PREVIOUS SUMMARY ENDING:\n{result[-3000:]}",
            retries,
        )
        return f"{result}\n\n{continuation}"

    @staticmethod
    def _extractive_summary(text, max_sentences=5, max_characters=1200):
        """Return a useful deterministic summary when the AI provider is unavailable."""
        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[.!?])\s+|\n+", text)
            if sentence.strip()
        ]
        if not sentences:
            return text.strip()[:max_characters]
        if len(sentences) <= max_sentences:
            return " ".join(sentences)[:max_characters]

        stop_words = {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
            "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with",
        }
        words = re.findall(r"[a-zA-Z][a-zA-Z0-9-]{2,}", text.lower())
        frequencies = Counter(word for word in words if word not in stop_words)
        ranked = sorted(
            range(len(sentences)),
            key=lambda index: sum(
                frequencies.get(word, 0)
                for word in re.findall(r"[a-zA-Z][a-zA-Z0-9-]{2,}", sentences[index].lower())
            ) / max(len(sentences[index].split()), 1),
            reverse=True,
        )
        selected = sorted(ranked[:max_sentences])
        return " ".join(sentences[index] for index in selected)[:max_characters]

    def _summarize_chunk(self, text):
        try:
            return self._generate(
                "You are a precise document analyst. Read the ENTIRE document section below "
                "before writing a complete but concise summary of every important section, "
                "including information near the end. For a resume, cover the professional "
                "profile, technical skills, education, every relevant position, notable "
                "projects, certifications, and achievements when present. For research or "
                "business documents, cover the purpose, methods, evidence, findings, "
                "limitations, and conclusions. Preserve meaningful names, numbers, dates, "
                "and outcomes, but do not copy contact details or invent information. Use "
                "clear Markdown headings and concise bullet points. Aim for 250-450 words, "
                "prioritize complete coverage, and finish with a complete sentence.\n\n"
                f"DOCUMENT SECTION:\n{text}"
            )
        except SummarizationError as error:
            print(f"Gemini unavailable; using local document summary: {error}")
            return self._extractive_summary(text)

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
        try:
            return self._generate(
                "Combine the section summaries below into one coherent, non-repetitive final summary. "
                "Cover information from the beginning, middle, and end without omitting "
                "education, experience, projects, achievements, methods, evidence, findings, "
                "limitations, or conclusions when present. Use clear Markdown headings and "
                "concise bullet points. Do not add facts that are absent from the sections.\n\n"
                f"SECTION SUMMARIES:\n{combined}"
            )
        except SummarizationError as error:
            print(f"Gemini unavailable; combining summaries locally: {error}")
            return self._extractive_summary(combined)
