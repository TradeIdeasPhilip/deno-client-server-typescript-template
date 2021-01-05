export const copyrightString = "© Trade-Ideas, LLC 2021";

// https://codereview.stackexchange.com/a/192241
export function rot13(str : any){
  return (str+'').replace(/[a-zA-Z]/gi,function(s){
     return String.fromCharCode(s.charCodeAt(0)+(s.toLowerCase()<'n'?13:-13))
  })
}