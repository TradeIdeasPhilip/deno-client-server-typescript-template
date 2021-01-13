# Deno Client Server Template
This is a template for a standard Deno client/server project.
## Main Idea
Edit client, server, and shared library files all in a single IDE, all in TypeScript. 
## Requirements
 - Use Deno and TypeScript to implement a server.
 - The server mostly talks with the client via HTTP.
 - Use TypeScript to implement the client.
 - Create TypeScript modules shared between the client and the server.
 - Use a single IDE to edit all three types of modules.
 - Intellisense in the editor should use the correct tsconfig file for each directory.
## `.js` is the new `.ts`
A surprisingly tricky issue is what file extension to use when importing from a TypeScript file.

`import { MyClass } from "./my-library.❔❔❔";`
### New Rules
 - All Deno TypeScript files always use the `.ts` file extension in their import statements.
 - All web facing or shared TypeScript files always use the `.js` file extension in their import statements.
 - Never leave the extension blank.
### Background
Microsoft has decided that you should never use the `.ts` extension in an import in a TypeScript file.
You can use the `.js` extension instead.
Microsoft is [adamant](https://github.com/microsoft/TypeScript/issues/16577#issuecomment-754941937) about these rules.

When verifying the file TypeScript will completely ignore the `.js` extension.
TypeScript will continue to use its normal rules to "find" the file you want to import.
In particular, if there's a file with the exact same name but with the `.ts` extension, it will look at the `.ts` file.

When creating the `.js` files, TypeScript will copy the file name exactly as is.
That is what we want!
That is what is required when the web browser is using the built in ES modules, rather than a 3rd party module loader.
And that *almost* works for Deno.
### What it means to us
When you are editing TypeScript files, VS Code uses the verifying rules described above.
If you import from a `.js` file, it will know that you really meant the corresponding `.ts` file.
Intellisense will check your files using all the TypeScript rules.
If you right click on the import file, and ask VS Code to take you there, it will take you to the `.ts` file, not the `.js` file.
The `.js` file doesn't have to even exist yet.

Before you run the Deno server, first run CopyLibraries.ts.
This copies the shared libraries from the everything-else project.
In the process it modifies the imports.
If you were importing from a `.js` file, the copy will import from the corresponding `.ts` file.
Deno doesn't know or care that we compiled some of these to JavaScript in a different directory.
## Current Status
### Modules
I **can** share modules between client and server.
And those modules **can** import other modules.
😃

You have to remember not to edit the wrong version of the shared library code.
I tried to mark the derived objects as read-only, but that didn't work.
I've marked the top of these with comments, but you could miss that.
### Editors
It all falls to pieces if I try to load the workspace.
Intellisense is flakey at best. 😢
Sometimes VS code tells me that the TypeScript service has died 5 times in a row.
Sometimes VS code does no syntax highlighting or suggesting at all.
Usually it makes some attempts, many of which fail, details vary from one run to the next.
The "problems" window and the red marks numbers in the "explorer" panel are similarly unpredictable.

If I only load the deno directory or the everything-else directory into VS Code, it works.

It's a real pain jumping back and forth.
For a slight improvement, use VS Code's "New Window" feature.
Keep the deno project in one window and the everything-else project in a different window.
### Debugger
The debugger works pretty well!
You can debug the server code right in VS Code.
You can debug the client code in Chrome.
Source maps work in Chrome.
😁
### Client Build Process
Client side files are built automatically.
When you try to access a `.js` or `.js.map` file our web server will check the dates of the files.
If the corresponding `.ts` file is newer, the web server will automatically call tsc.

`.ts` files now work like normal `.js`, `.html`, and `.php` files.
You just save your change in your editor then hit refresh in your browser.
### Server Build Process
The server side works but it needs more automation.
Currently you need to run a Deno script from the terminal tab of the other VS Code window to copy some files.
Finally you hit the run button in the second VS Code window.

It should be easy to add all of this to the run button.
https://stackoverflow.com/questions/35327016/using-prelaunchtasks-and-naming-a-task-in-visual-studio-code
I stopped here because I made a lot of progress on the proof of concept and I wanted to commit before I broke something else.

Ideally the server part should be running constantly.
It should watch for file changes.
If any shared `.ts` files change, `CopyLibraries.ts` should automatically notice and do another copy.
## Prerequisites
To make this project work you need to install:
 - [VS Code](https://code.visualstudio.com/download)
 - [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (including git-bash) and
 - [tsc](https://www.typescriptlang.org/download) (I used the npm install.)
## Bonus Points
 - Make 2 spaces the default for new files.
 - Add a sample ts file that uses tsx.
