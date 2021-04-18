export {};

//const a = Deno.readLink;  // This should work for Deno server projects only.
//const b = document.createElement("a");  // This should work for Dom projects only.

declare function alert(message?:string) :void;

// These should work in both places.
alert("Ⅻ");
const c = alert;

//alert(12);  // This should only work for Dom projects.

const d = new WebSocket("");  // This should work both places.