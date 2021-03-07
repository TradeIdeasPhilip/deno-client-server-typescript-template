export class StreamingReader {
  private readonly webSocket : WebSocket;
  constructor(url? : string) {
    this.webSocket = new WebSocket(url ?? "ws://127.0.0.1:9000/streaming/l1.tcl");
    (["close", "open", "error", "message"] as const).forEach((type) => {
      this.webSocket.addEventListener(type, (event) => {
        console.log({type, event});
      });
    })
  }
  send(message : string) {
    this.webSocket.send(message);
  }
};