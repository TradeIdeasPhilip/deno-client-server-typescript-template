import { addTsCompiler } from "./AutoCompile.ts";
import { AugmentedRequest, WebServer } from "./Dispatcher.ts";
import { tripleRot13 } from "./shared/high-security.ts";
import { copyrightString } from "./shared/useful-stuff.ts";

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
webServer.start();

console.log("running out of", Deno.cwd());
console.log("Listening.", "http://127.0.0.1:9000/static/", copyrightString);

