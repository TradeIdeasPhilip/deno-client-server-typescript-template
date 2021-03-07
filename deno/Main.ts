import { addTsCompiler } from "./AutoCompile.ts";
import { AugmentedRequest, WebServer } from "./Dispatcher.ts";
import { tripleRot13 } from "./shared/high-security.ts";
import { copyrightString, sleep } from "./shared/useful-stuff.ts";
import { EchoRequest } from "./shared/web-socket-protocol.ts";
import {
  acceptWebSocket,
  isWebSocketCloseEvent,
  isWebSocketPingEvent,
  WebSocket,
WebSocketEvent,
} from "https://deno.land/std/ws/mod.ts";

const webServer: WebServer = new WebServer();

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
              console.log({ i, echoRequest });
              webSocket.send(echoRequest.message);
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

