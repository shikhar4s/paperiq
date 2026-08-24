from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import os
import json
import datetime
import logging

# --- Import your models to interact with the database ---
from .models import User, DocumentData, Entity
from mongoengine.errors import DoesNotExist, ValidationError

# --- Lazy tool initialization ---------------------------------------------
# The heavy/3rd-party clients (spaCy model, Gemini SDK, NLTK corpora) are
# created on first use instead of at import time. This keeps `manage.py`
# commands like `collectstatic`/`migrate` runnable during a Docker build
# without requiring runtime secrets (e.g. GEMINI_API_KEY) to be present,
# and avoids crashing the WSGI worker at startup if a single dependency is
# misconfigured.
_pipeline = None
_extractor = None
_summarizer = None
logger = logging.getLogger(__name__)


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from paperiq_tools.Pipeline import DocumentPipeline
        _pipeline = DocumentPipeline()
    return _pipeline


def _get_extractor():
    global _extractor
    if _extractor is None:
        from paperiq_tools.InsightExtractor import InsightExtractor
        _extractor = InsightExtractor()
    return _extractor


def _get_summarizer():
    global _summarizer
    if _summarizer is None:
        from paperiq_tools.summarizer import GeminiSummarizer
        _summarizer = GeminiSummarizer()
    return _summarizer

# --- UNCHANGED: This view remains a simple utility for debugging ---
@csrf_exempt
@api_view(['POST'])
def ingest_document(request):
    """
    Extracts raw text from a document. Does not save to the database.
    Returns the FULL raw text.
    """
    file_path = None
    try:
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        
        file_path = default_storage.save(file.name, file)
        abs_path = os.path.join(default_storage.location, file_path)
        raw_text = _get_pipeline().ingest_document(abs_path)

        return JsonResponse({"message": "File ingested successfully", "text": raw_text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)

# --- UNCHANGED: This view remains a simple utility for debugging ---
@csrf_exempt
@api_view(['POST'])
def preprocess_text(request):
    """
    Cleans a given piece of text. Does not save to the database.
    Returns the FULL cleaned text.
    """
    try:
        text = request.POST.get("text")
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        clean_text = _get_pipeline().clean_text(text)
        return JsonResponse({"clean_text": clean_text})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- UPDATED: Returns full data and handles exceptions ---
@csrf_exempt
@api_view(['POST'])
def extract_insights(request):
    """
    Extracts entities and keywords from text. Does not save to the database.
    Returns the FULL list of entities and keywords.
    """
    try:
        text = request.POST.get("text")
        if not text:
            return JsonResponse({"error": "No text provided"}, status=400)

        insights = _get_extractor().extract(text)
        return JsonResponse({
            "entities": insights.get("entities", []),
            "keywords": insights.get("keywords", [])
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# --- HEAVILY UPDATED: This is now the main endpoint for processing AND saving ---
@csrf_exempt
@api_view(['POST'])
def summarize_text(request):
    """
    Processes a document, generates a summary, extracts insights,
    and saves the Document and its Entities linked to the authenticated user.
    """
    file_path = None
    try:
        user = request.user  # ✅ pulled from JWT
        if not user:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded"}, status=400)

        title = request.POST.get("title", file.name)
        source_url = request.POST.get("source_url", "")

        # 1️⃣ Save the file temporarily
        file_path = default_storage.save(file.name, file)
        abs_path = os.path.join(default_storage.location, file_path)

        # 2️⃣ Process, summarize, and extract
        clean_text = _get_pipeline().process_document(abs_path)
        summary = _get_summarizer().summarize(clean_text)
        insights = _get_extractor().extract(clean_text)

        # 3️⃣ Create Document record
        new_document = DocumentData(
            title=title,
            abstract=summary,
            source_url=source_url,
            ingestion_date=datetime.datetime.utcnow(),
            uploaded_by=user
        )
        new_document.save()

        entities_saved = []
        for entity_tuple in insights.get("entities", []):
            entity_text, entity_type = entity_tuple
            new_entity = Entity(
                entity_text=entity_text,
                entity_type=entity_type,
                doc=new_document,
                user=user  # ✅ added
            )
            new_entity.save()
            entities_saved.append({"text": entity_text, "type": entity_type})

        return JsonResponse({
            "status": "success",
            "filename": file.name,
            "summary": summary,
            "doc_id": str(new_document.doc_id),
            "entities_saved_count": len(entities_saved),
        })

    except Exception as e:
        logger.exception("Document summarization failed")
        from paperiq_tools.summarizer import SummarizationError
        if isinstance(e, SummarizationError):
            return JsonResponse(
                {"error": "The AI summarization service could not process this document. Please try again."},
                status=502,
            )
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)
    finally:
        if file_path and default_storage.exists(file_path):
            default_storage.delete(file_path)
