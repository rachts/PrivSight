"""
Face embeddings management - generation, storage, and comparison.
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

import face_recognition
import numpy as np
from database import DatabaseManager

# cv2 is only imported lazily when needed (not on startup),
# to avoid libxcb errors in headless cloud environments.
cv2 = None

def _get_cv2():
    """Lazily load cv2 to avoid GUI library crashes on startup in cloud."""
    global cv2
    if cv2 is None:
        import cv2 as _cv2
        cv2 = _cv2
    return cv2

logger = logging.getLogger(__name__)


class FaceEmbeddingsManager:
    """Manage face embeddings for recognition."""

    def __init__(self, embeddings_path: str):
        """
        Initialize embeddings manager.

        Args:
            embeddings_path: Path to JSON file storing face embeddings
        """
        self.embeddings_path = Path(embeddings_path)
        self.embeddings: Dict[str, Any] = {}
        self.db = DatabaseManager()
        self.load_embeddings()

    def load_embeddings(self) -> None:
        """Load embeddings from database (primary) or disk (fallback)."""
        if self.db.is_available():
            self.embeddings = self.db.get_all_faces()
            if self.embeddings:
                logger.info(f"[Embeddings] Loaded {len(self.embeddings)} registered faces from MongoDB")
                return
            else:
                logger.info("[Embeddings] MongoDB is empty, checking for local migration...")

        # Fallback to local file / Migration logic
        if self.embeddings_path.exists():
            try:
                with open(self.embeddings_path, 'r') as f:
                    local_data = json.load(f)
                
                if local_data:
                    self.embeddings = local_data
                    logger.info(f"[Embeddings] Loaded {len(self.embeddings)} registered faces from local JSON")
                    
                    # Migration: If DB is available but was empty, sync local data to DB
                    if self.db.is_available():
                        logger.info("[Embeddings] Migrating local data to MongoDB...")
                        for fid, data in self.embeddings.items():
                            # Ensure numpy types are converted (already should be lists in JSON)
                            self.db.upsert_face(fid, data)
                else:
                    self.embeddings = {}
            except Exception as e:
                logger.error(f"[Embeddings] Error loading local embeddings: {e}")
                self.embeddings = {}
        else:
            logger.info("[Embeddings] No existing embeddings found in DB or local file")

    def save_embeddings(self, face_id: Optional[str] = None) -> None:
        """
        Save embeddings to database and/or disk.
        
        Args:
            face_id: Optional ID to specifically sync to database
        """
        # Save specific change to DB if available
        if self.db.is_available() and face_id:
            data = self.embeddings.get(face_id)
            if data:
                self.db.upsert_face(face_id, data)
        
        # Always mirror to local disk for redundancy/offline support
        try:
            self.embeddings_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.embeddings_path, 'w') as f:
                json.dump(self.embeddings, f, indent=2)
            logger.debug(f"[Embeddings] Synced embeddings to {self.embeddings_path}")
        except Exception as e:
            logger.error(f"[Embeddings] Error syncing embeddings to disk: {e}")

    def register_face(
        self,
        frames: List[np.ndarray],
        name: str = "User"
    ) -> str:
        """
        Register a new face from multiple frames.

        Args:
            frames: List of image frames (numpy arrays)
            name: Name for the registered face

        Returns:
            Embedding ID
        """
        logger.info(f"[Register] Registering face for '{name}' with {len(frames)} frames")

        embeddings_list = []
        for i, frame in enumerate(frames):
            try:
                # Detect face locations and encodings
                face_locations = face_recognition.face_locations(frame)
                face_encodings = face_recognition.face_encodings(frame, face_locations)

                if face_encodings:
                    # Use the first detected face
                    embedding = face_encodings[0].tolist()
                    embeddings_list.append(embedding)
                    logger.debug(f"[Register] Frame {i+1}: Face detected")
                else:
                    logger.warning(f"[Register] Frame {i+1}: No face detected")

            except Exception as e:
                logger.error(f"[Register] Error processing frame {i+1}: {e}")

        if not embeddings_list:
            raise ValueError("No faces detected in provided frames")

        # Average embeddings for more robust recognition
        avg_embedding = np.mean(embeddings_list, axis=0).tolist()

        # Generate unique ID and store
        face_id = f"face_{len(self.embeddings) + 1}"
        self.embeddings[face_id] = {
            'name': name,
            'embedding': avg_embedding,
            'registered_at': int(np.datetime64('now').astype(int) / 1e6),
            'num_samples': len(embeddings_list),
        }

        self.save_embeddings(face_id)
        logger.info(f"[Register] Face registered successfully with ID: {face_id}")
        return face_id

    def recognize_face(
        self,
        frame: np.ndarray,
        tolerance: float = 0.6
    ) -> tuple[bool, Optional[str], float]:
        """
        Recognize a face in a frame.

        Args:
            frame: Image frame to analyze
            tolerance: Distance threshold for face matching (0-1, lower = stricter)

        Returns:
            Tuple of (is_registered, face_id/None, confidence)
        """
        try:
            # Detect faces in frame
            face_locations = face_recognition.face_locations(frame)
            face_encodings = face_recognition.face_encodings(frame, face_locations)

            if not face_encodings:
                return False, None, 0.0

            # Compare against registered faces
            results = []
            for encoding in face_encodings:
                best_match = None
                best_distance = float('inf')
                best_confidence = 0.0

                for face_id, face_data in self.embeddings.items():
                    stored_embedding = np.array(face_data['embedding'])
                    distance = face_recognition.face_distance(
                        [stored_embedding],
                        encoding
                    )[0]

                    # Lower distance = better match
                    if distance < best_distance:
                        best_distance = distance
                        best_match = face_id
                        # Confidence is inverse of distance
                        best_confidence = max(0, 1 - distance)

                if best_distance < tolerance:
                    results.append((True, best_match, best_confidence))
                else:
                    results.append((False, None, best_confidence))

            # Return first result (primary face)
            if results:
                is_registered, face_id, confidence = results[0]
                return is_registered, face_id, confidence

            return False, None, 0.0

        except Exception as e:
            logger.error(f"[Recognition] Error recognizing face: {e}")
            return False, None, 0.0

    def get_registered_faces(self) -> List[Dict[str, Any]]:
        """Get list of all registered faces."""
        return [
            {
                'id': face_id,
                'name': data['name'],
                'registered_at': data['registered_at'],
                'num_samples': data['num_samples'],
            }
            for face_id, data in self.embeddings.items()
        ]

    def delete_face(self, face_id: str) -> bool:
        """Delete a registered face."""
        if face_id in self.embeddings:
            del self.embeddings[face_id]
            # Delete from DB
            if self.db.is_available():
                self.db.delete_face(face_id)
            # Sync to disk
            self.save_embeddings()
            logger.info(f"[Embeddings] Deleted face: {face_id}")
            return True
        return False

    def clear_all(self) -> None:
        """Clear all registered faces."""
        self.embeddings.clear()
        # Clear DB
        if self.db.is_available():
            self.db.clear_all()
        # Sync to disk
        self.save_embeddings()
        logger.warning("[Embeddings] All registered faces cleared")
