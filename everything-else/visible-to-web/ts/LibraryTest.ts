export {};

//const a = Deno.readLink;  // This should work for Deno server projects only.
const b = document.createElement("a");  // This should work for Dom projects only.

// Ideally this should work in both places, but it's not a huge priority.
const c = alert;  // This should work both places.

const d = new WebSocket("");  // This should work both places.