import unittest
from unittest.mock import Mock, patch

from paperiq_tools.Pipeline import DocumentPipeline
from paperiq_tools.summarizer import GeminiSummarizer


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
    def build_summarizer(self):
        summarizer = GeminiSummarizer.__new__(GeminiSummarizer)
        summarizer.api_key = "test-key"
        summarizer.endpoint = "https://example.invalid/generateContent"
        return summarizer

    @patch("paperiq_tools.summarizer.requests.post")
    def test_short_document_uses_one_model_call(self, post):
        post.return_value = Mock(
            ok=True,
            json=lambda: {"candidates": [{"content": {"parts": [{"text": "Useful summary"}]}}]},
        )
        summarizer = self.build_summarizer()
        self.assertEqual(summarizer.summarize("Short document"), "Useful summary")
        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.kwargs["json"]["generationConfig"]["maxOutputTokens"], 4096)

    @patch("paperiq_tools.summarizer.requests.post")
    def test_truncated_response_continues_remaining_sections(self, post):
        post.side_effect = [
            Mock(
                ok=True,
                json=lambda: {
                    "candidates": [{
                        "content": {"parts": [{"text": "### Experience\nBuilt document tools."}]},
                        "finishReason": "MAX_TOKENS",
                    }],
                },
            ),
            Mock(
                ok=True,
                json=lambda: {
                    "candidates": [{
                        "content": {"parts": [{"text": "### Projects\nCreated PaperIQ."}]},
                        "finishReason": "STOP",
                    }],
                },
            ),
        ]

        result = self.build_summarizer().summarize("Experience and projects across the document")

        self.assertIn("### Experience", result)
        self.assertIn("### Projects", result)
        self.assertEqual(post.call_count, 2)

    @patch("paperiq_tools.summarizer.requests.post")
    def test_model_failure_returns_real_local_summary(self, post):
        post.return_value = Mock(
            ok=False,
            status_code=403,
            json=lambda: {"error": {"message": "Project denied access"}},
        )
        source = "PaperIQ processes research papers. It preserves names and important findings."
        result = self.build_summarizer().summarize(source)
        self.assertEqual(result, source)
        self.assertNotIn("Error summarizing this chunk", result)


if __name__ == "__main__":
    unittest.main()
