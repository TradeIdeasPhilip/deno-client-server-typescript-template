export class StreamingReader {
  private readonly webSocket : WebSocket;
  constructor(url? : string) {
    this.webSocket = new WebSocket(url ?? "ws://127.0.0.1:9000/streaming/l1.tcl");
    this.webSocket.addEventListener("close", (event) => {
      console.log({type: "StreamingReader close", reason: event.reason, timeStamp : event.timeStamp, wasClean: event.wasClean, isTrusted: event.isTrusted});
    });
    this.webSocket.addEventListener("open", (event) => {
      console.log({type: "StreamingReader open", timeStamp : event.timeStamp, isTrusted: event.isTrusted});
    });
    this.webSocket.addEventListener("error", (event) => {
      console.log({type: "StreamingReader error", timeStamp : event.timeStamp, isTrusted: event.isTrusted});
    });
    this.webSocket.addEventListener("message", (event) => {
      console.log({type: "StreamingReader message", data: event.data, timeStamp : event.timeStamp });
    });
  }
  send(message : string) {
    this.webSocket.send(message);
  }
};