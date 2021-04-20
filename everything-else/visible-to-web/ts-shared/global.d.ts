// 𝒟ℯ𝓃ℴ 𝓈𝓀𝒾𝓅 ℯ𝓃𝓉𝒾𝓇ℯ 𝒻𝒾𝓁ℯ

// These are items that should be available to the Dom and to Deno.  However,
// it was not possible to reference the right library, so I copied the declaration here.

// For example, alert() is defined as part of lib.dom.d.ts.  And alert() is also available
// in Deno.  However, most of lib.dom.d.ts is not available to Deno, so I can't include
// that entire library.

// These are sometimes called "ambient" declarations.

// These are global because I never said "import" or "export", so TypeScript assumes all
// of these declarations are in the global scope.  This file is a *not* a package. You can
// reference alert() like normal.  Do *not* to say import "global" or  global.alert("hello").

// You access use these declarations in two different ways.
// 1) Most of the time you just put this file in the same directory as your other
//    TypeScript files.  More precisely, look at your tsconfig.json file and see what
//    directories tsc is looking at.
// 2) If you can't do that, consider /// <reference path = "../../some/path/global.d.ts" />
// Do *not* explicitly name this file in an import statement.

// Interesting:  The definitions of alert() are slightly different between the two
// platforms.  The Dom allows message to be any, but Deno requires a string.  I copied the
// more restrictive declaration.

declare function alert(message?:string) :void;
