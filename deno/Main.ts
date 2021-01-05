// deno run --unstable --allow-net --allow-read --allow-write --allow-run Main.ts

import { AugmentedRequest, WebServer } from "./Dispatcher.ts";
//import { tripleRot13 } from "../everything-else/visible-to-web/ts-shared/high-security.ts";
import { copyrightString, rot13 } from "../everything-else/visible-to-web/ts-shared/useful-stuff.ts";

const webServer: WebServer = new WebServer();

webServer.addFileHandler("/static", "../everything-else/visible-to-web/");
webServer.addPrefixAction("/js-bin/greet", (request: AugmentedRequest, remainder: string) => {
  const encryptedName = request.searchParams.get("encrypted_name");
  const name = encryptedName?rot13(encryptedName):"<anonymous>";
  const response = "Hello " + name + "  (" + copyrightString + ")";
  request.respond({body: response});
});
///js-bin/greet?encrypted_name
webServer.start();

console.log("running out of", Deno.cwd());
console.log("Listening.", "http://127.0.0.1:9000/static/", copyrightString);

