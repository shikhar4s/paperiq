from django.urls import path
from . import views

urlpatterns = [
    path('ingest/', views.ingest_document, name='ingest_document'),
    path('preprocess/', views.preprocess_text, name='preprocess_text'),
    path('extract/', views.extract_insights, name='extract_insights'),
    path('summarize/', views.summarize_text, name='summarize_text'),
]
