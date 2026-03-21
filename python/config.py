import os

CONFIG = {
    "HOST": "localhost",
    "PORT": int(os.environ.get("WS_PORT", 8765)),
    "CAMERA_INDEX": 0,
    "PROCESS_EVERY_N_FRAMES": 3,
    "DEBUG": os.environ.get("DEBUG", "False").lower() == "true"
}
