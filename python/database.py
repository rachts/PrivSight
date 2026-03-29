import os
import logging
from typing import Optional, List, Dict, Any
import numpy as np

# Lazy import pymongo to allow local execution without the library if URI missing
try:
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages facial data persistence via MongoDB."""
    
    def __init__(self, uri: Optional[str] = None):
        """
        Initialize database manager.
        
        Args:
            uri: Optional connection string. Defaults to MONGODB_URI env var.
        """
        self.uri = uri or os.getenv('MONGODB_URI')
        self.client = None
        self.db = None
        self.collection = None
        self.connected = False
        
        if self.uri and PYMONGO_AVAILABLE:
            try:
                # Set a 5-second timeout for the initial connection
                self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)
                # Test connection (ping)
                self.client.admin.command('ping')
                
                # Default database: privsight
                self.db = self.client.get_database('privsight')
                # Default collection: faces
                self.collection = self.db.get_collection('faces')
                self.connected = True
                logger.info("[Database] Connected successfully to MongoDB")
            except Exception as e:
                logger.error(f"[Database] Connection failed: {e}")
                self.connected = False
        elif not PYMONGO_AVAILABLE:
             logger.warning("[Database] Pymongo library not found. Persistent db disabled.")

    def is_available(self) -> bool:
        """Check if the database connection is active."""
        return self.connected

    def upsert_face(self, face_id: str, data: Dict[str, Any]) -> bool:
        """
        Save or update a face entry.
        
        Args:
            face_id: Unique string identifier for the face
            data: Dictionary containing name, embedding (list), etc.
        """
        if not self.connected:
            return False
        
        try:
            # Map face_id to a field
            doc = data.copy()
            doc['face_id'] = face_id
            
            self.collection.update_one(
                {'face_id': face_id},
                {'$set': doc},
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"[Database] Upsert failed for {face_id}: {e}")
            return False

    def get_all_faces(self) -> Dict[str, Any]:
        """
        Retrieve all registered faces from the database.
        
        Returns:
            Dictionary mapped by face_id
        """
        if not self.connected:
            return {}
            
        try:
            faces = {}
            cursor = self.collection.find({})
            for doc in cursor:
                fid = doc.get('face_id')
                if not fid: continue
                
                # Cleanup internal mongo fields
                if '_id' in doc: 
                    del doc['_id']
                
                faces[fid] = doc
            return faces
        except Exception as e:
            logger.error(f"[Database] Retrieval failed: {e}")
            return {}

    def delete_face(self, face_id: str) -> bool:
        """Delete a face entry."""
        if not self.connected:
            return False
            
        try:
            result = self.collection.delete_one({'face_id': face_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"[Database] Delete failed for {face_id}: {e}")
            return False

    def clear_all(self) -> bool:
        """Clear the entire faces collection."""
        if not self.connected:
            return False
            
        try:
            self.collection.delete_many({})
            return True
        except Exception as e:
            logger.error(f"[Database] Clear collection failed: {e}")
            return False
