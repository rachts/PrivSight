export class SocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 2000;
  private maxRetries: number = 5;
  private retries: number = 0;

  constructor(url: string) {
    this.url = url;
  }

  connect(onMessage: (data: any) => void) {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retries = 0;
      console.log('Connected to AI Server');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    };

    this.ws.onclose = () => {
      if (this.retries < this.maxRetries) {
        this.retries++;
        setTimeout(() => this.connect(onMessage), this.reconnectInterval);
      }
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
