# PrivSight Cloud Backend - Production Dockerfile
# This installs all required system libraries (X11, OpenGL) for
# dlib/face_recognition/opencv before pip install, guaranteeing
# they are available at runtime.

FROM python:3.13-slim

# Install system dependencies that dlib, face_recognition, and opencv need.
# These are the exact libraries that cause ImportError on Railway's
# minimal Nixpacks container: libX11.so.6, libxcb.so.1, libGL.so.1
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libx11-6 \
    libxcb1 \
    libxkbcommon0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory to /app (Railway convention)
WORKDIR /app

# Copy only requirements first (better Docker cache)
COPY python/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python backend source code
COPY python/ .

# Railway sets PORT env var automatically
ENV PYTHONUNBUFFERED=1
ENV PRIVSIGHT_CLOUD=true

# Expose default port
EXPOSE 8000

# Start the FastAPI server
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
