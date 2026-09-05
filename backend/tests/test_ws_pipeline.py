import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestWSAudioPipeline(unittest.TestCase):
    def test_ws_audio_pipeline(self):
        client = TestClient(app)
        with client.websocket_connect("/ws/audio") as ws:
            handshake = ws.receive_json()
            self.assertEqual(handshake["type"], "connected")
            self.assertIn("session_id", handshake)

            warmups = 0
            predictions = 0

            for i in range(14):
                ws.send_bytes(b"dummy_opus_pcm_audio_chunk_" + bytes([i]))

                if i < 9:
                    msg = ws.receive_json()
                    self.assertEqual(msg["type"], "warming_up")
                    warmups += 1
                elif i == 9:
                    msg = ws.receive_json()
                    self.assertIn("risk_score", msg)
                    self.assertIn("risk_level", msg)
                    self.assertIn("spoof_probability", msg)
                    self.assertIn("speaker_similarity", msg)
                    self.assertIn("prosodic_anomaly", msg)
                    self.assertIn("phonetic_evidence", msg)
                    self.assertIn("context_risk", msg)
                    self.assertIn("timestamp", msg)
                    self.assertIsInstance(msg["timestamp"], int)
                    self.assertIsInstance(msg["phonetic_evidence"], (float, int))
                    predictions += 1
                elif i == 10:
                    pass  # step 1 of 2 -> buffering, no message
                elif i == 11:
                    msg = ws.receive_json()
                    self.assertIn("risk_score", msg)
                    predictions += 1

            self.assertEqual(warmups, 9)
            self.assertEqual(predictions, 2)

if __name__ == "__main__":
    unittest.main()
