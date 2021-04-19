// 𝒟ℯ𝓃ℴ 𝓈𝓀𝒾𝓅 ℯ𝓃𝓉𝒾𝓇ℯ 𝒻𝒾𝓁ℯ

// These are items that should be available to the Dom and to Deno.  However,
// it was not possible to reference the right library, so I copied the declaration here.

// For example, alert() is defined as part of lib.dom.d.ts.  And alert() is also available
// in Deno.  However, most of lib.dom.d.ts is not available to Deno, so I can't include
// that entire library.

// Interesting:  The definitions of alert() are slightly different between the two
// platforms.  The Dom allows message to be any, but Deno requires a string.  I copied the
// more restrictive declaration.

declare function alert(message?:string) :void;
