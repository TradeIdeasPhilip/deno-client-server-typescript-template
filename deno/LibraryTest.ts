export {};

const a = Deno.readLink;  // This should work for Deno server projects only.
//const b = document.createElement("a");  // This should work for Dom projects only.
const c = alert;  // This should work both places.

const d = new WebSocket("");  // This should work both places.