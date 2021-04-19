import { rot13 } from "./useful-stuff.js";

// This is ugly but it works.
// This should be in a lib.*.d.ts file.  TODO

/**
 * 100% kid-sister-proof
 * @param str Plaintext
 */
export function tripleRot13(str : string) {
  // Note:  When I'm running this from the VS Code debugger alert() does nothing.
  // alert() prints a message and prompts for [Enter] when I run Deno from the command prompt. 
  // TODO Add better examples.
  // That said, this is all about compile time errors and warnings, so it doesn't really matter.
  alert("Not for export to ITAR Prohibited Countries.");
  return rot13(rot13(rot13(str)));
}