from Pipeline import DocumentPipeline
from InsightExtractor import InsightExtractor
from summarizer import GeminiSummarizer
import json

def main():
    print("🚀 Initializing PaperIQ Modules...")
    pipeline = DocumentPipeline()
    extractor = InsightExtractor()
    summarizer = GeminiSummarizer()

    file_path = "research_paper_3.pdf"
    print(f"\n📄 Processing document: {file_path}")
    clean_text = pipeline.process_document(file_path)
    print("✅ Document cleaned successfully!")

    print("\n🔍 Extracting insights...")
    insights = extractor.extract(clean_text)
    print("✅ Insights extracted!")

    print("\n🧾 Generating AI Summary using Gemini...")
    summary = summarizer.summarize(clean_text)
    print("✅ Summary generated successfully!\n")

    print("🧩 --- INSIGHTS PREVIEW ---")
    print("Entities:", insights["entities"][:10])
    print("Keywords:", insights["keywords"][:10])

    print("\n🧠 --- SUMMARY PREVIEW ---")
    print(summary[:600]) 

    output = {
        "file": file_path,
        "entities": insights["entities"],
        "keywords": insights["keywords"],
        "summary": summary
    }

    with open("paperIQ_output.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4, ensure_ascii=False)

    print("\n💾 Results saved to 'paperIQ_output.json' successfully!")

if __name__ == "__main__":
    main()
