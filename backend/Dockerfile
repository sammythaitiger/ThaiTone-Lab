FROM python:3.11-slim

# Install system dependencies needed by soundfile / librosa
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Filter out montreal-forced-aligner to speed up Docker builds
# since it is not imported directly by the FastAPI web service.
RUN sed -i '/montreal-forced-aligner/d' requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port and run uvicorn
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
