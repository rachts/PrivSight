import asyncio
import json
import logging
import websockets

logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.clients = set()

    async def handler(self, websocket):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                pass # Handle inbound if needed
        finally:
            self.clients.remove(websocket)

    async def broadcast(self, event_type: str, payload: dict):
        if not self.clients:
            return
        message = json.dumps({"type": event_type, "payload": payload})
        await asyncio.gather(
            *[client.send(message) for client in self.clients],
            return_exceptions=True
        )

    async def start(self):
        logger.info(f"Starting WS server on {self.host}:{self.port}")
        async with websockets.serve(self.handler, self.host, self.port):
            await asyncio.Future()  # run forever
