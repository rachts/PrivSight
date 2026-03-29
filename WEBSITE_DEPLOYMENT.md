# PrivSight Web Deployment Guide

This guide describes how to deploy PrivSight to the web using **Vercel** (Frontend) and **Railway** (Backend).

## 1. Backend Deployment (Railway)

The Python backend handles the MediaPipe face recognition and attention detection logic.

### Steps:
1.  **Create a Railway Project**: Go to [Railway.app](https://railway.app/) and create a new project.
2.  **Add MongoDB**: Click "New" -> "Database" -> "Add MongoDB". Railway will spin up a persistent instance.
3.  **Connect GitHub**: Connect your repository.
3.  **Root Directory**: Set the root directory for the backend deployment to `python/`.
5.  **Environment Variables**:
    - `PRIVSIGHT_CLOUD`: `true`
    - `MONGODB_URI`: Copy the "Connection URL" from your Railway MongoDB service variables.
    - `PYTHONUNBUFFERED`: `1`
5.  **Build & Deploy**: Railway will automatically detect the `Procfile` and use `uvicorn main:app` to start the server.
6.  **Copy the URL**: Once deployed, Railway will provide a URL like `https://privsight-backend.up.railway.app`. Change `https://` to `wss://` and add `/ws` to the end.
    - Example: `wss://privsight-backend.up.railway.app/ws`

## 2. Frontend Deployment (Vercel)

The Next.js frontend provides the dashboard and captures the webcam stream.

### Steps:
1.  **Create a Vercel Project**: Go to [Vercel.com](https://vercel.com/) and import your repository.
2.  **Environment Variables**:
    - `NEXT_PUBLIC_WS_URL`: The WebSocket URL from Step 1 (e.g., `wss://privsight-backend.up.railway.app/ws`).
3.  **Build Settings**:
    - Framework Preset: `Next.js`
    - Install Command: `npm install`
    - Root Directory: `./` (project root).
4.  **Deploy**: Click deploy. Vercel will pick up your `package-lock.json` automatically.

## 3. How it Works (Web Mode)
- **Persistent Storage**: Facial data (embeddings) are stored in your **MongoDB** database. This ensures that even if the backend service restarts or is redeployed, your registered faces are never lost.
- **Migration**: On your first deployment, the app will automatically migrate any existing `face_embeddings.json` data into the MongoDB database.
- **Frame Streaming**: Since cloud servers cannot access your local webcam, the browser captures frames from your video feed and sends them to the Railway backend via the WebSocket.
- **Real-time Processing**: The backend processes these frames and sends back detection results (number of faces, attention status, etc.).
- **Privacy Shield**: If the backend detects a stranger or "shoulder surfing," it sends a trigger to the frontend to blur the screen.

## Troubleshooting
- **Latency**: If the detection feels slow, try reducing the `previewFrameRate` in `hooks/usePrivSightSocket.ts` or the interval in `components/WebcamPreview.tsx`.
- **Camera Access**: Ensure your browser has permission to access the webcam. WebRTC requires an `https://` connection (which Vercel provide by default).

---
*Created by PrivSight Team*
