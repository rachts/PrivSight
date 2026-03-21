import logging
import json
import os

logger = logging.getLogger(__name__)

class FaceRegistry:
    def __init__(self, storage_path="faces.json"):
        self.storage_path = storage_path
        self.registered_faces = {}
        self.load()

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r") as f:
                    self.registered_faces = json.load(f)
                logger.info(f"Loaded {len(self.registered_faces)} registered faces.")
            except Exception as e:
                logger.error(f"Failed to load faces: {e}")

    def save(self):
        try:
            with open(self.storage_path, "w") as f:
                json.dump(self.registered_faces, f)
        except Exception as e:
            logger.error(f"Failed to save faces: {e}")

    def register_face(self, name, embedding):
        self.registered_faces[name] = embedding
        self.save()
        logger.info(f"Registered new face: {name}")

    def is_known(self, embedding, threshold=0.6):
        # Placeholder for actual euclidean distance check
        return False
