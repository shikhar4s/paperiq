import nltk
from rake_nltk import Rake
import spacy

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('punkt_tab')

class InsightExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        self.nlp.max_length = 2000000 
        self.rake = Rake()
        self.rake._tokenize_text_to_sentences = lambda text: nltk.sent_tokenize(text)

    def extract_entities(self, text, chunk_size=50000):
        """Extract named entities using spaCy in chunks"""
        entities = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i+chunk_size]
            doc = self.nlp(chunk)
            entities.extend([(ent.text, ent.label_) for ent in doc.ents])
        return entities

    def extract_keywords(self, text, chunk_size=50000):
        """Extract keywords using RAKE in chunks to handle large text"""
        keywords = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i+chunk_size]
            self.rake.extract_keywords_from_text(chunk)
            keywords.extend(self.rake.get_ranked_phrases())
        return keywords

    def extract(self, text):
        """Full extraction pipeline"""
        entities = self.extract_entities(text)
        keywords = self.extract_keywords(text)
        return {
            "entities": entities,
            "keywords": keywords
        }
# if __name__ == "__main__":
#     from Pipeline import DocumentPipeline
#     pipeline = DocumentPipeline()
#     clean_text = pipeline.process_document("research_paper_3.pdf")

#     extractor = InsightExtractor()
#     insights = extractor.extract(clean_text)
    

#     print("Entities (Preview):", insights["entities"][:20])
#     print("Keywords (Preview):", insights["keywords"][:20])