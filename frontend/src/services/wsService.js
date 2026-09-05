// frontend/src/services/wsService.js
/**
 * WebSocket Service — SIH-26104
 *
 * Manages a single persistent WebSocket connection to the FastAPI backend.
 * Sends binary audio chunks and receives JSON risk results.
 *
 * Usage:
 *   const ws = new WSService("ws://localhost:8000/ws/audio", sessionId);
 *   ws.connect(onMessage, onStatusChange);
 *   ws.sendChunk(audioBlob);
 *   ws.disconnect();
 */

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/audio";

export class WSService {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.socket = null;
    this._onMessage = null;
    this._onStatusChange = null;
    this._onError = null;
    this._isExplicitClose = false;
  }

  connect(onMessage, onStatusChange, onError) {
    this._onMessage = onMessage;
    this._onStatusChange = onStatusChange;
    this._onError = onError;
    this._isExplicitClose = false;

    const url = `${WS_URL}?session_id=${this.sessionId}`;
    this._onStatusChange?.("connecting");

    try {
      this.socket = new WebSocket(url);
      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = () => {
        console.log("[WS] Connected to:", url);
        this._onStatusChange?.("connected");
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Control messages from backend
          if (data.type === "connected") {
            console.log("[WS] Handshake confirmed:", data);
            return;
          }
          if (data.type === "session_ended") {
            console.log("[WS] Session ended confirmed:", data);
            return;
          }

          // Forward warming_up or prediction messages
          this._onMessage?.(data);
        } catch (err) {
          console.warn("[WS] Malformed or non-JSON message received:", event.data, err);
          this._onError?.(new Error("Received malformed message from WebSocket server"));
        }
      };

      this.socket.onclose = (event) => {
        console.log("[WS] Closed code:", event.code, "reason:", event.reason);
        if (!this._isExplicitClose) {
          if (event.code !== 1000) {
            this._onStatusChange?.("error", `Disconnected unexpectedly (code: ${event.code})`);
          } else {
            this._onStatusChange?.("disconnected");
          }
        } else {
          this._onStatusChange?.("disconnected");
        }
      };

      this.socket.onerror = (err) => {
        console.error("[WS] Connection error:", err);
        this._onStatusChange?.("error", "WebSocket connection failed");
        this._onError?.(err);
      };
    } catch (err) {
      console.error("[WS] Failed to instantiate WebSocket:", err);
      this._onStatusChange?.("error", err.message);
      this._onError?.(err);
    }
  }

  /**
   * Send a binary audio chunk to the backend.
   * @param {Blob|ArrayBuffer} chunk
   */
  async sendChunk(chunk) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      if (chunk instanceof Blob) {
        const buffer = await chunk.arrayBuffer();
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(buffer);
        }
      } else {
        this.socket.send(chunk);
      }
    } catch (err) {
      console.error("[WS] Error sending audio chunk:", err);
    }
  }

  disconnect() {
    this._isExplicitClose = true;
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "end_session" }));
        }
        this.socket.close(1000, "User stopped session");
      } catch (err) {
        console.warn("[WS] Error during clean disconnect:", err);
      }
      this.socket = null;
    }
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
