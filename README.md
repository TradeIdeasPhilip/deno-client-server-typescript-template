# Deno Client/Server TypeScript Template
This is a template for a standard Deno client/server project.
Watch [overview](https://youtu.be/ifFaOuZ1aiE) on YouTube.
## Main Idea
Edit client, server, and shared library files all in a single IDE, all in TypeScript. 
## Requirements
 - Use Deno and TypeScript to implement a server.
 - The server mostly talks with the client via HTTP.
 - Use TypeScript to implement the client.
 - Create TypeScript modules shared between the client and the server.
 - Use a single IDE to edit all three types of modules.
 - Intellisense in the editor should use the correct tsconfig file for each directory.

The tools to do this are all readily available, but it can be challenging to make them all work together.
## `.js` is the new `.ts`
A surprisingly tricky issue is what file extension to use when a TypeScript module needs to import from another TypeScript module.

`import { MyClass } from "./my-library.❓❓❓";`
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
### 4/25/2022
I've been doing a lot of front end work in TypeScript recently.
I have not touched Deno or any serious server stuff in a while.

#### Vite

__CORRECTION__ Vite _does_ allow you to use the `*.ts` file extension in a <script> tag in your `*.html` files.
_However_, if you add the `*.ts` file extension file extension to your TypeScript `import` statements, VS Code will complain, and the build will fail.
🙁

I've had good luck using [Vite](https://vitejs.dev/) as my build tool handle npm, bundling, etc.
Vite has some nice features that can help in a hybrid Deno / client project.

For one thing, if you want to import a TypeScript file, you use the `*.ts` file extension.
This is the same for the client and the server.
So you can share the source files directly!

Vite is also good about reading files from `../` and similar places.  
So you can set up a directory structure like:
```
my-project/
my-project/shared-libraries
my-project/deno-stuff
my-project/client-stuff
my-project/interfaces
```
You can edit and build `client-stuff` like a normal Vite project.
You can edit and run `deno-stuff` like a normal Deno project.  
You would store all of `my-project` in one git repository.

If a file is shared by multiple projects, you can use a git submodule to take care of it.
For an example, that's how I do libraries between https://github.com/TradeIdeasPhilip/bounce-3d and https://github.com/TradeIdeasPhilip/roughjs-with-vite.
I tried that trick before I used Vite, but I ran into problems back then.
For one thing, when Vite creates a JavaScript file, it goes directly into the release directory, not the source directory.
That becomes important if your projects don't all have _identical_ `tsconfig.json` files.

In practice I found that I had some shared libraries that I want to use in every JavaScript project.
A git submodule is perfect for those files.
And I have interfaces describing the data that goes between the client and the server.
Those files would be stored in the same git repository as the deno and client source code.

Vite includes its own development webserver that translates the source files on the fly.
I was doing that with my own Deno web server.
I liked the idea of using my own server to deliver the HTML and JavaScript files so I could mix live data into those files.
I wanted to store PHP style templates.
Let my server add the live data at the same time as it does the compiling.
I've lost that ability, but it doesn't seem huge.

There are many alternatives and competitors.
I picked Vite because it is small and simple and it does what I need.
It seems helpful in lots of places, including a mixed Deno & client project.

#### Still needs work

* One editor for both projects — I haven't tried lately.  As far a I know, things still crash if you try to put Deno and a client project into the same VS Code workspace.
* Different tsconfig's for different files or directories. — I haven't seen any version of this anywhere!  I want Intellisense to know that `console` is available in all files but `Deno` and `document.createElement()` only work in specific files.  You can do that on a project by project basis, but I want the shared files to be smarter. 
* Make 2 spaces the default for new files. — This seemed so simple when I first listed it.  I suspect there are multiple formatters all competing in my VS Code.
* Add a sample ts file that uses tsx. — jsx/tsx is very powerful.  It's built into some tools.  I'd like to do more with it.

If you've gotten any of this to work, please let me know.

### 12/9/2021
Last time I checked, some of this code broke over time.
I stand by the requirements.
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
😎

I'm not sure why I had to do the build in the web server.
In [other projects](https://github.com/TradeIdeasPhilip/penrose-tiling/blob/master/.vscode/tasks.json) I use tsc in watch mode.
As soon as I save a `.ts` file in the editor, typescript rebuilds the corresponding `.js` and `.js.map` files.
It would be nice to remove AutoCompile.ts in favor of `tsc --watch`, but tsc wasn't working well in this project for some reason.

### Server Build Process
The server side works but it needs more automation.

A build task called "Copy Libraries" copies and fixes the shared `.ts` files.
Any time you hit the green arrow to start the server, this automatically runs first.

Hit control-shift-B to run this any time you like.
You want to do this periodically to make sure Intellisense is up to date.
Ideally the copy script should be running constantly.
It should watch for file changes so you don't miss any.
## Prerequisites
To make this project work you need to install:
 - [Deno](https://deno.land/manual/getting_started/installation)
 - [VS Code](https://code.visualstudio.com/download) including [JavaScript and TypeScript](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) and [Deno](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) extensions.
 - [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (more precisely, git-bash, which is included with git) and
 - [tsc](https://www.typescriptlang.org/download) (I used the npm install.)
## Bonus Points
 - Make 2 spaces the default for new files.
 - Add a sample ts file that uses tsx.
