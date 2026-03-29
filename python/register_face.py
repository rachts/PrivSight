#!/usr/bin/env python3
"""
Simple CLI tool for registering a face without the Electron app.
Useful for testing the face recognition engine.

Usage:
    python register_face.py <name>
    
Example:
    python register_face.py "John Doe"
"""

import sys
import os
from pathlib import Path

def main():
    import cv2
    from face_embeddings import FaceEmbeddingsManager
    from webcam_handler import WebcamHandler
    if len(sys.argv) < 2:
        print("Usage: python register_face.py <name>")
        print("Example: python register_face.py 'John Doe'")
        sys.exit(1)

    name = sys.argv[1]
    embeddings_path = Path(__file__).parent / 'data' / 'face_embeddings.json'
    embeddings_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"\n🔒 Privacy App - Face Registration")
    print("=" * 50)
    print(f"Registering face for: {name}")
    print("=" * 50)

    # Initialize managers
    embeddings_manager = FaceEmbeddingsManager(str(embeddings_path))
    webcam = WebcamHandler(frame_skip=1, target_size=(640, 480))

    print("\n📹 Initializing webcam...")
    import time
    time.sleep(1)

    print("✓ Webcam ready")
    print("\nCapturing frames... Stand in front of the camera!")
    print("Press 'q' to cancel\n")

    captured_frames = []
    frame_count = 0
    max_frames = 10

    try:
        while frame_count < max_frames:
            frame = webcam.get_frame_raw()
            if frame is not None:
                # Convert to BGR for display
                display_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

                # Add text overlay
                cv2.putText(
                    display_frame,
                    f"Frame {frame_count + 1}/{max_frames}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )
                cv2.putText(
                    display_frame,
                    "Press SPACE to capture, Q to cancel",
                    (20, display_frame.shape[0] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    1,
                )

                cv2.imshow("Face Registration", display_frame)

                key = cv2.waitKey(30) & 0xFF
                if key == ord('q'):
                    print("\n❌ Registration cancelled")
                    break
                elif key == ord(' '):
                    captured_frames.append(frame)
                    frame_count += 1
                    print(f"✓ Captured frame {frame_count}/{max_frames}")

    finally:
        cv2.destroyAllWindows()
        webcam.release()

    if len(captured_frames) < 3:
        print(f"\n❌ Not enough frames captured ({len(captured_frames)}/3 minimum)")
        sys.exit(1)

    print(f"\n✓ Captured {len(captured_frames)} frames")
    print("🔄 Generating facial embeddings...")

    try:
        face_id = embeddings_manager.register_face(captured_frames, name)
        print(f"✓ Face registered successfully!")
        print(f"  ID: {face_id}")
        print(f"  Name: {name}")
        print(f"  Stored at: {embeddings_path}")

        # Show all registered faces
        registered_faces = embeddings_manager.get_registered_faces()
        print(f"\n📋 Registered faces ({len(registered_faces)} total):")
        for face in registered_faces:
            print(f"  - {face['name']} (ID: {face['id']})")

    except ValueError as e:
        print(f"\n❌ Registration failed: {e}")
        sys.exit(1)

    print("\n✓ Face registration complete!")
    print("You can now start the main app and your face will be recognized.\n")


if __name__ == '__main__':
    main()
