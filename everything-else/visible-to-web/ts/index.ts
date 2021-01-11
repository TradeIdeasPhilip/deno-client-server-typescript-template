import { copyrightString } from "../ts-shared/useful-stuff.js";
import { tripleRot13 } from "../ts-shared/high-security.js";
import { getById } from "./client-misc.js";


const nameInput = getById("name", HTMLInputElement);
const goButton = getById("go", HTMLButtonElement);
const answerP = getById("answer", HTMLParagraphElement);
const copyrightP = getById("copyright", HTMLParagraphElement);

goButton.addEventListener("click", async ev => {
  const name = nameInput.value.trim();
  const encryptedName = tripleRot13(name);
  const response = await fetch("/js-bin/greet?encrypted_name=" + encodeURIComponent(encryptedName));
  const todisplay = await response.text();
  answerP.innerText = todisplay;
});

copyrightP.innerText = copyrightString;