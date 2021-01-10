import { rot13 } from "./useful-stuff.ts";

/**
 * 100% kid-sister-proof
 * @param str Plaintext
 */
export function tripleRot13(str : string) {
  return rot13(rot13(rot13(str)));
}