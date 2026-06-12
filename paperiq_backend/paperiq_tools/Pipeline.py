import os
import docx
import fitz  
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords")
nltk.download("wordnet")

class DocumentPipeline:
    def __init__(self):
        self.documents = {}
        self.stop_words = set(stopwords.words("english"))
        self.lemmatizer = WordNetLemmatizer()

    def ingest_pdf(self, file_path):
        doc = fitz.open(file_path)
        text = "".join([page.get_text() for page in doc])
        return text

    def ingest_docx(self, file_path):
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    def ingest_txt(self, file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def ingest_document(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            text = self.ingest_pdf(file_path)
        elif ext == ".docx":
            text = self.ingest_docx(file_path)
        elif ext == ".txt":
            text = self.ingest_txt(file_path)
        else:
            raise ValueError("Unsupported file format: " + ext)
        
        self.documents[file_path] = text
        return text
    

    def clean_text(self, text):
        text = text.lower()                            
        text = re.sub(r'[^a-z\s]', '', text)           
        tokens = text.split()                          
        tokens = [w for w in tokens if w not in self.stop_words]  
        tokens = [self.lemmatizer.lemmatize(w) for w in tokens]   
        return " ".join(tokens)

    def process_document(self, file_path):
        raw_text = self.ingest_document(file_path)
        clean_text = self.clean_text(raw_text)
        return clean_text
    

# if __name__ == "__main__":
#     pipeline = DocumentPipeline()
#     result = pipeline.process_document("research paper 3.pdf")
    
#     print("Processed Text (Preview):")
#     print(result[:500])