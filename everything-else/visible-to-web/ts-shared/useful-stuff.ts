export const copyrightString = "© Trade-Ideas, LLC 2020-2021";

// https://codereview.stackexchange.com/a/192241
export function rot13(str : string){
  return (str).replace(/[a-zA-Z]/gi,function(s){
     return String.fromCharCode(s.charCodeAt(0)+(s.toLowerCase()<'n'?13:-13))
  })
}

// https://stackoverflow.com/a/39914235/971955
export function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let libraryContext = "Deno server 🦕";
// The following line will be commented out when we copy to the Deno server.
libraryContext = "Web client 🕸";  // 𝒩ℴ𝓉 𝒻ℴ𝓇 𝒟ℯ𝓃ℴ
console.log("LIBRARY CONTEXT:", libraryContext);
