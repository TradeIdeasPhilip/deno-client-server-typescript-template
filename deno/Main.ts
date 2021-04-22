import { addTsCompiler } from "./AutoCompile.ts";
import { AugmentedRequest, WebServer } from "./Dispatcher.ts";
import { tripleRot13 } from "./shared/high-security.ts";
import { copyrightString, sleep } from "./shared/useful-stuff.ts";
import { EchoRequest } from "./shared/web-socket-protocol.ts";
import { StreamingReader } from "./shared/streaming-reader.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
WebSocketEvent,
} from "https://deno.land/std/ws/mod.ts";

const webServer: WebServer = new WebServer();

const textEncoder = new TextEncoder();

webServer.addFileHandler("/static", "../everything-else/visible-to-web/", addTsCompiler);
webServer.addPrefixAction("/js-bin/greet", (request: AugmentedRequest, remainder: string) => {
  const encryptedName = request.searchParams.get("encrypted_name");
  const name = encryptedName?tripleRot13(encryptedName):"<anonymous>";
  const response = "Hello " + name + "  (" + copyrightString + ")";
  request.respond({body: response});
  return Promise.resolve(true);
});
///js-bin/greet?encrypted_name
webServer.addPrefixAction("/streaming", async (request, remainder) => {
  const { conn, r: bufReader, w: bufWriter, headers } = request;
  acceptWebSocket({
    conn,
    bufReader,
    bufWriter,
    headers,
  })
    .then(async (webSocket) => {
      console.log("opened new web socket", request.path, request.searchParams, remainder);
      for await  (const ev of webSocket) {
        console.log("webSocket event", ev);
        const echoRequest = EchoRequest.tryDecode(ev);
        if (echoRequest) {
          (async () => {
            for (let i = 0; i < echoRequest.repeatCount; i++) {
              await sleep(echoRequest.delay);
              //console.log({ i, echoRequest });
              if (i % 2) {
                // Odd Numbers
                webSocket.send(textEncoder.encode(echoRequest.message));
              } else {
                // Even Numbers
                webSocket.send(echoRequest.message);
              }
            }
          })();
          console.log("TODO handle echo request", echoRequest);
        }
      }
    })
    .catch(async (err) => {
      console.error(`failed to accept websocket: ${err}`);
      await request.respond({ status: 400 });
    });
  return true;
})
webServer.start();

console.log("running out of", Deno.cwd());
console.log("Listening.", "http://127.0.0.1:9000/static/", copyrightString);

// Prove that we can connect to a WebSocket server using the same exact software
// as a web page would use.  In this case we are connecting to ourself.  That makes
// the test much simpler.
(async () => {
  await sleep(10000);
  console.log("Starting web socket client test.");
  const streamingReader = new StreamingReader();
  await sleep(500);
  console.log("Sending first request.");
  const r1 = new EchoRequest("once / second", 3, 1000);
  streamingReader.send(r1.encode());
  await sleep(250);
  console.log("Sending second request.");
  const r2 = new EchoRequest("twice / second", 6, 500);
  streamingReader.send(r2.encode());
})();
