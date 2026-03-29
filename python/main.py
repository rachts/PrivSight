from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
import asyncio
import logging
import json
import os
from datetime import datetime

# Import core server logic and state
from server import state, handle_message, handle_init, monitoring_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PrivSightCloud")

app = FastAPI(title="PrivSight Cloud Backend")

@app.get("/")
def home():
    return {
        "status": "PrivSight backend running",
        "mode": "cloud",
        "initialized": state.webcam is not None,
        "clients_active": len(state.clients)
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Wrap FastAPI websocket to look like websockets.server.WebSocketServerProtocol
    # sufficiently for our state.clients set and handle_message logic.
    # Note: server.py expects websockets.WebSocketServerProtocol but we can adapt.
    
    class WSWrapper:
        def __init__(self, ws: WebSocket):
            self.ws = ws
            self.remote_address = ("cloud_client", 0)
        async def send(self, message: str):
            await self.ws.send_text(message)
        async def close(self):
            await self.ws.close()

    wrapper = WSWrapper(websocket)
    state.clients.add(wrapper)
    logger.info(f"Cloud client connected. Total clients: {len(state.clients)}")

    try:
        # Initial status broadcast
        await wrapper.send(json.dumps({
            'type': 'presence_update',
            'payload': {'status': 'connecting', 'message': 'Cloud bridge active'}
        }))

        while True:
            try:
                # Receive message from client
                message = await websocket.receive_text()
                data = json.loads(message)
                
                # Use server.py handlers
                await handle_message(wrapper, data)
                
            except json.JSONDecodeError:
                await wrapper.send(json.dumps({'type': 'error', 'payload': {'message': 'Invalid JSON'}}))
            except Exception as e:
                logger.error(f"Error handling cloud message: {e}")
                
    except WebSocketDisconnect:
        logger.info("Cloud client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        state.clients.discard(wrapper)
        logger.info(f"Client removed. Total clients: {len(state.clients)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Ensure monitoring loop starts if not already running (initialized by 'init' message)
    uvicorn.run(app, host="0.0.0.0", port=port)
