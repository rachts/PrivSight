from fastapi import FastAPI, WebSocket
import uvicorn
import asyncio
import logging

# We import the existing PrivSight server components so they could theoretically be run, 
# although Railway deployment lacks a physical webcam (cv2.VideoCapture(0) will fail).
# We catch exceptions to ensure Railway doesn't crash on boot.
try:
    from server import monitoring_loop
except ImportError:
    pass

app = FastAPI()

@app.get("/")
def home():
    return {"status": "PrivSight backend running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Send an initial connect message mirroring the local WS behavior
    await websocket.send_json({"type": "presence_update", "payload": {"status": "user_detected"}})
    
    try:
        while True:
            # We fulfill the prompt's request
            await websocket.send_text("connected")
            await asyncio.sleep(5)
    except Exception as e:
        print(f"WebSocket disconnected: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
