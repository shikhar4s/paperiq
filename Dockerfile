# syntax=docker/dockerfile:1.7

# =============================================================================
# Stage 1 — Build the React (Vite) front-end
# =============================================================================
FROM node:22.17.0-alpine AS frontend

WORKDIR /app

# Install JS dependencies first to leverage layer caching
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install --legacy-peer-deps

# Build the front-end. vite.config.ts emits the build into
# ./paperiq_backend/frontend_dist (relative to the project root).
COPY . .
RUN npm run build


# =============================================================================
# Stage 2 — Django application image
# =============================================================================
FROM python:3.12-slim-bookworm AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    NLTK_DATA=/usr/local/share/nltk_data \
    PORT=8000

# Minimal system packages needed at runtime (lxml, PyMuPDF, Pillow-like deps).
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        build-essential \
        libxml2 \
        libxslt1.1 \
        libjpeg62-turbo \
        zlib1g \
        curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for better Docker layer caching.
COPY paperiq_backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
 && pip install --retries 10 -r /app/requirements.txt

# Pre-download NLTK corpora so cold starts don't depend on network access.
RUN python -m nltk.downloader -d ${NLTK_DATA} stopwords wordnet punkt punkt_tab

# Copy the Django project source.
COPY paperiq_backend/ /app/

# Copy the React build produced in stage 1.
COPY --from=frontend /app/paperiq_backend/frontend_dist /app/frontend_dist

# Collect static assets (React build + Django admin) for WhiteNoise.
# Provide harmless build-time env values so settings.py imports cleanly.
ENV DJANGO_SECRET_KEY=build-only-key \
    DJANGO_DEBUG=False \
    DJANGO_ALLOWED_HOSTS=*
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Render (and most PaaS) inject $PORT; bind to it and fall back to 8000 locally.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn paperiq_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --timeout 120 --access-logfile - --error-logfile -"]
