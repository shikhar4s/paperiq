import re
from collections import defaultdict

from rake_nltk import Rake
import spacy


class InsightExtractor:
    """Bounded, deduplicated keyword and entity extraction for long documents."""

    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm", disable=["parser"])
        self.nlp.add_pipe("sentencizer")
        self.nlp.max_length = 2_000_000
        self.rake = Rake()

    @staticmethod
    def _chunks(text, chunk_size=20_000):
        """Split near paragraph/sentence boundaries instead of cutting words."""
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

    def extract_entities(self, text, chunk_size=20_000, limit=250):
        """Return unique entities, preferring the most frequently mentioned."""
        counts = defaultdict(lambda: {"count": 0, "text": "", "label": ""})
        chunks = list(self._chunks(text, chunk_size))
        for document in self.nlp.pipe(chunks, batch_size=4):
            for entity in document.ents:
                value = re.sub(r"\s+", " ", entity.text).strip(" ,.;:()[]")
                if len(value) < 2:
                    continue
                key = (value.casefold(), entity.label_)
                counts[key]["count"] += 1
                counts[key]["text"] = value
                counts[key]["label"] = entity.label_

        ranked = sorted(counts.values(), key=lambda item: (-item["count"], item["text"].casefold()))
        return [(item["text"], item["label"]) for item in ranked[:limit]]

    def extract_keywords(self, text, chunk_size=20_000, limit=50):
        """Aggregate RAKE scores across chunks and return stable top phrases."""
        scores = defaultdict(float)
        display_names = {}
        for chunk in self._chunks(text, chunk_size):
            self.rake.extract_keywords_from_text(chunk)
            for score, phrase in self.rake.get_ranked_phrases_with_scores():
                phrase = re.sub(r"\s+", " ", phrase).strip(" ,.;:()[]")
                if len(phrase) < 3 or len(phrase.split()) > 8:
                    continue
                key = phrase.casefold()
                scores[key] += float(score)
                display_names.setdefault(key, phrase)

        ranked = sorted(scores, key=lambda key: (-scores[key], key))
        return [display_names[key] for key in ranked[:limit]]

    def extract(self, text):
        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")
        return {
            "entities": self.extract_entities(text),
            "keywords": self.extract_keywords(text),
        }
