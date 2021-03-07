import { copyrightString } from "../ts-shared/useful-stuff.js";
import { tripleRot13 } from "../ts-shared/high-security.js";
import { getById } from "./client-misc.js";
import { StreamingReader } from "../ts-shared/streaming-reader.js";
import { EchoRequest } from "../ts-shared/web-socket-protocol.js";


const nameInput = getById("name", HTMLInputElement);
const goButton = getById("go", HTMLButtonElement);
const answerP = getById("answer", HTMLParagraphElement);
const copyrightP = getById("copyright", HTMLParagraphElement);

goButton.addEventListener("click", async ev => {
  const name = nameInput.value.trim();
  const encryptedName = tripleRot13(name);
  const response = await fetch("/js-bin/greet?encrypted_name=" + encodeURIComponent(encryptedName));
  const toDisplay = await response.text();
  answerP.innerText = toDisplay;
});

copyrightP.innerText = copyrightString;

const streamingReader = new StreamingReader();
(window as any).streamingReader = streamingReader;

const wsMessage = getById("ws_message", HTMLInputElement);
const wsRepeatCount = getById("ws_repeat_count", HTMLInputElement);
const wsDelay = getById("ws_delay", HTMLInputElement);
const wsSendButton = getById("ws_send_button", HTMLButtonElement);

wsSendButton.addEventListener("click", () => {
  const request = new EchoRequest(wsMessage.value, wsRepeatCount.value, wsDelay.value);
  streamingReader.send(request.encode());
});

