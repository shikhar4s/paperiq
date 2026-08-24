import unittest
from unittest.mock import Mock

from paperiq_tools.Pipeline import DocumentPipeline
from paperiq_tools.summarizer import GeminiSummarizer, SummarizationError


class PipelineTests(unittest.TestCase):
    def test_clean_text_preserves_semantic_information(self):
        source = "PaperIQ analyzes 25 documents.\npre-\nprocessing keeps Dr. Rao and 92.5%.\n\nPage 3"
        cleaned = DocumentPipeline().clean_text(source)
        self.assertEqual(
            cleaned,
            "PaperIQ analyzes 25 documents.\npreprocessing keeps Dr. Rao and 92.5%.",
        )

    def test_clean_text_rejects_empty_input(self):
        with self.assertRaises(ValueError):
            DocumentPipeline().clean_text("   ")


class SummarizerTests(unittest.TestCase):
    def build_summarizer(self, responses):
        summarizer = GeminiSummarizer.__new__(GeminiSummarizer)
        summarizer.model = Mock()
        summarizer.model.generate_content.side_effect = [Mock(text=value) for value in responses]
        return summarizer

    def test_short_document_uses_one_model_call(self):
        summarizer = self.build_summarizer(["Useful summary"])
        self.assertEqual(summarizer.summarize("Short document"), "Useful summary")
        self.assertEqual(summarizer.model.generate_content.call_count, 1)

    def test_model_failure_does_not_return_placeholder_summary(self):
        summarizer = GeminiSummarizer.__new__(GeminiSummarizer)
        summarizer.model = Mock()
        summarizer.model.generate_content.side_effect = RuntimeError("404 model unavailable")
        with self.assertRaises(SummarizationError):
            summarizer.summarize("Short document")


if __name__ == "__main__":
    unittest.main()
