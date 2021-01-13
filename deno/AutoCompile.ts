import { AugmentedRequest, WebServer } from "./Dispatcher.ts";

function bashQuote(args : string[]) : string {
  let result = "";
  args.forEach(arg => {
    if (result != "") {
      result += " ";
    }
    result += '"';
    // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
    // We need to add a \ before each ", $, `, and \.
    // Everything else is automatically protected by the double quotes.
    result += arg.replaceAll(/"|\$|`|\\/g, "\\$&");
    result += '"';
  });
  return result;
}

/**
 * Reformats a command so it will be run through bash.
 * This avoids some odd issues with Windows.
 * @param args The command you want to execute followed by its arguments.  E.g. `["tsc", "../lib dir/ts/my file.ts"]`
 * @returns A list suitable for giving to Deno.run().  E.g. `["bash", "-c", "\"tsc\" \"../lib dir/ts/my file.ts\""]`
 */
function bashify(...args : string[]) : string[] {
  // I'm not sure why this is required.
  // tsc works fine from the git bash prompt and from the DOS prompt.
  // But I get file not found when I try to run it directly from Deno.run().
  // If I try to run tsc from Windows Power Shell I get a different error.
  // My Windows Power Shell is not configured to run scripts.
  return ["bash", "-c", bashQuote(args)];
}

const decoder = new TextDecoder();

/**
 * Run tsc.  If there are problems send them to the console/log.
 * @param fileName The TypeScript file to compile.
 * @returns true on success.
 */
async function compile(fileName : string) : Promise<boolean>{
  console.log(compile, "🤞");
  try {
    const cmd = Deno.run({
      // Ideally we'd run use the settings in the tsconfig file.
      // But that's not how tsc works.
      // Either you point to a tsconfig file and compile the entire project.
      // Or you point to a *.ts file and you list all settings on the command line.
      cmd: bashify("tsc", "--module", "esnext", "--removeComments", "--sourceMap", fileName),
      //cmd: bashify("echo", fileName, "abcdef", "\"", "`'#$!🤞", "back \\ slash", "top\nbottom"),
      stdout: "piped",
      stderr: "piped",
    });
    const output = await cmd.output() // "piped" must be set
    const outStr = decoder.decode(output);
    const error = await cmd.stderrOutput();
    const errorStr = new TextDecoder().decode(error); 
    const success = (await cmd.status()).success;
    cmd.close();
    // Need TODO a better job of error handling.  I think the success variable is correct, but I
    // want to double check.  Once that's done, clean up the output.  Report a lot fewer details
    // on success.
    console.log({compile, fileName, outStr, errorStr, success});
    return true;
  } catch (ex) {
    console.log({ex, fileName});
    return false;
  }
}

/**
 * @param fileName The file you want information about.
 * @returns The results of Deno.stat() on success, or undefined on failure.
 */
async function stat(fileName : string) : Promise<Deno.FileInfo | undefined> {
  try {
    return await Deno.stat(fileName);
  } catch (ex) {
    return undefined;
  }
}

/**
 * This is made for use with WebServer.addFileHandler().  It will check if a file is a derived
 * object, and if it is out of date.  If so it will call the compiler to create / update the
 * requested file.  If something goes wrong, we send an error back to the client.  Otherwise
 * we let the normal file handler finish the request.
 * @param fileName The file requested by the client.
 * This has already been converted from a url to something the local filesystem understands.
 * @param request The original request.
 * @returns True if we responded, false if someone else needs to respond.
 */
export async function addTsCompiler(fileName : string, request : AugmentedRequest) : Promise<boolean> {
  const match = /^(.*\.)((js)|(js.map))$/.exec(fileName);
  if (!match) {
    // We only handle those two file extensions.
    return false;
  }
  const sourceFileName = match[1] + "ts";
  const sourceInfo = await stat(sourceFileName);
  if (!sourceInfo) {
    // Could not access the source file.  Presumably the file does not exist.
    // we have nothing to contribute.  It's tempting to signal a 404 here.
    // If there is a *.js file maybe it's old and the corresponding *.ts file
    // was deleted.
    return false;
  }
  const destinationInfo = await stat(fileName);
  let needToCompile : boolean;
  if (!destinationInfo) {
    // Source exists, but not destination.
    needToCompile = true;
  } else if (!(sourceInfo.mtime && destinationInfo.mtime)) {
    // We don't have timestamps so we can't say for sure.
    console.log({warning: "can't read file times", sourceInfo, destinationInfo });
    needToCompile = false;
  } else {
    // If the source file was modified after the last build, rebuild.
    needToCompile = sourceInfo.mtime > destinationInfo.mtime;
  }
  if (needToCompile && !await compile(sourceFileName)) {
    // Compile was required but failed.  Report an error.
    request.respond({status: 500, body: "Compile failed."});
    return true;
  }
  // If there was something we needed to do, we've done it.  Now
  // pass control back to the file handler so it can send the
  // requested file.
  return false;
}
