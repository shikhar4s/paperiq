from django.http import JsonResponse, HttpResponse
from django.shortcuts import render


def render_react(request):
    return render(request, 'index.html')


def healthz(request):
    """Lightweight liveness endpoint used by Render's health check."""
    return JsonResponse({"status": "ok"})