export class StreamingReader {
  private readonly webSocket : WebSocket;
  constructor(url? : string) {
    this.webSocket = new WebSocket(url ?? "ws://127.0.0.1:9000/streaming/l1.tcl");
    this.webSocket.binaryType = "arraybuffer";
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
      const msg : any = {type: "StreamingReader message", data: event.data, timeStamp : event.timeStamp };
      if (event.data instanceof ArrayBuffer) {
        msg.convertedToString = new TextDecoder().decode(event.data);
      }
      console.log(msg);
    });
  }
  send(message : string) {
    this.webSocket.send(message);
  }
};