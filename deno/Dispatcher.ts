// This is a framework for a simple application server.
// It's worked for me in other projects.
// It's easy for other modules to implement ad-ons in JavaScript.
// And you can also point it to static files.
// REMEMBER: If you use modules in your client code you can't test directly from the file system, you must use a web server.

import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";


export type AugmentedRequest = ServerRequest & {
  path: string;
  searchParams: URLSearchParams;
};

/**
 * Return true if we have handled this request, false if someone else should handle this.
 */

type Action = {
  (request: AugmentedRequest): boolean;
};

type PrefixAction = {
  (request: AugmentedRequest, remainder: string): void;
};

export class WebServer {
  private static readonly BREAK_QUERY_STRING = /^([^?]*)(\??.*)$/;
  private task: Promise<void> | undefined;
  private readonly actions: Action[] = [];
  public notFound(req: AugmentedRequest) {
    req.respond({ body: "404\n" }); // TODO set return code
  }

  private async run() {
    const s = serve({ port: 9000 });
    for await (const req of s) {
      const headers: Headers = req.headers;
      //const url : URL = new URL(req.url, "http://" + (headers.get("host")??"www.example.com") + "/");
      //const response : string = JSON.stringify({ ...url});
      //req.respond({ body: response + "\n" });
      //req.respond({ body: JSON.stringify( {...req, w: "removed", r:"removed", headers : Array.from(req.headers)}) + "\n" });
      const regexpResult = WebServer.BREAK_QUERY_STRING.exec(req.url)!;
      const r = req as AugmentedRequest;
      r.path = WebServer.sanitize(regexpResult[1]);
      console.log(r.path, new Date());
      r.searchParams = new URLSearchParams(regexpResult[2]);
      let handled = false;
      for (const action of this.actions) {
        handled = action(r);
        if (handled) {
          break;
        }
      }
      if (!handled) {
        this.notFound(r);
      }
    }
  }

  public addAction(action: Action): void {
    this.actions.push(action);
  }

  public addPrefixAction(urlPrefix: string, action: PrefixAction) {
    // TODO it would be nice if we could add an error handler here that would respond to the
    // client with an appropriate error message.
    // That means we need to know if action is async or not.
    this.addAction((request: AugmentedRequest): boolean => {
      // Note:  the "?" part of the query has already been removed from request.path and moved
      // to request.searchParams.  The prefix "/abc" will match the query "http://127.0.0.1:8000/abc?de=fg".
      const remainder = WebServer.dirPrefix(urlPrefix, request.path);
      if (remainder === undefined) {
        return false;
      } else {
        action(request, remainder);
        return true;
      }
    });
  }

  public addFileHandler(urlPrefix: string, filePrefix: string): void {
    this.addPrefixAction(
      urlPrefix,
      async (request: AugmentedRequest, remainder: string) => {
        async function tryOnce(localFileName : string) : Promise<boolean> {
          try {
            const file = await Deno.open(localFileName);
            const headers = new Headers();
            if (/\.js$/.test(localFileName)) {
              headers.append("content-type", "text/javascript");
            }
            request.respond({ body: file, headers });
            return true;
          } catch(ex) {
            console.log("possible 404", localFileName);
            return false;
          }
        }
        const localFile = filePrefix + remainder;
        if (await tryOnce(localFile)) {
          // Success!
          return;
        }
        if ((!/\/index.html$/.test(localFile)) && (await tryOnce(localFile + "/index.html"))) {
          // Success, after adding /index.html.
          return;
        }
        console.log("404", localFile);

        // TODO when I tried to open a directory the server crashes.  Other errors (like file not found)
        // are caught by the catch() above.
        // [phil@joey-mousepad admin]$ curl 'http://localhost:8000/static'
        // curl: (52) Empty reply from server
        // [phil@joey-mousepad admin]$ error: Uncaught Error: Is a directory (os error 21)
        // at unwrapResponse (deno:cli/rt/10_dispatch_minimal.js:59:13)
        // at sendAsync (deno:cli/rt/10_dispatch_minimal.js:98:12)
        // at async read (deno:cli/rt/12_io.js:99:19)
        // at async Object.iter (deno:cli/rt/12_io.js:53:22)
        // at async writeChunkedBody (_io.ts:178:20)
        // at async writeResponse (_io.ts:282:5)
        // at async ServerRequest.respond (server.ts:84:7)
        // [1]    Exit 1                        deno run --allow-net --allow-read=static --allow-run Main.ts
        // request.respond() returns a Promise<void> so maybe we need to add a .catch() there.
      },
    );
  }
  public start() {
    if (!this.task) {
      this.task = this.run();
    }
  }

  /**
   * Converts a path in a standard format.
   * 
   * This is mostly aimed at safety.  You don't want someone to ask for the file
   * "/free_stuff/../../../../../etc/passwd".  That would be converted to "/etc/passwd".
   * We try to honor .. within the path.  "a/b/c/../d" => "/a/b/d".
   * 
   * Converts backslash to slash.  Removes duplicate slashes.  Removes "." directory references.
   * The result always starts with a slash.  The result only ends in a slash if the entire string
   * is "/".
   * @param path The input path.  The query string, protocol, hash, etc., should already be removed.
   */

  static sanitize(path: string): string {
    // TODO should this include some of the logic from getSafePath()?
    // Split on / or \.
    const original: string[] = path.split(/\/|\\/);
    const final: string[] = [];
    original.forEach((segment) => {
      if (segment == "..") {
        // Remove these immediately.
        // If we are already at the top, ignore this.
        final.pop();
      } else if ((segment == ".") || (segment == "")) {
        // Explicitly ignore.
        // /// => /
        // /././ => /
      } else {
        final.push(segment);
      }
    });
    return "/" + final.join("/");
    // path . replaceAll() any number of adjacent // gets replace with a single /
    path = path.replaceAll(/\/+/g, "/");
    // replaceAll /./ becomes /
    // if it ends in /. remove the final .
    path = path.replaceAll(/\/\.(?=\/|$)/g, "");
    // work from the end.  /[^/]*/../ (but need to quote the slashes) gets replaced by /
    //   Repeat until all gone
    //   final .. does not need a trailing /
    //   If the string starts with /../ or is only /.., just remove it and replace it with /
    if (path[0] != "/") {
      path = "/" + path;
    }
  }

  /**
   * Returns undefined if prefix is not a prefix of path.
   * 
   * We assume that prefix is a directory name.  We only report a match if 
   * the prefix is exactly the same as the path, or if the prefix is immediately
   * followed by a /.
   * 
   * If the path is a match, we return the part of the match after the /, or just
   * "" if there was nothing after the prefix.  Warning, "" and undefined are both
   * considered false.
   * 
   * Examples:
   * * ("/abc", "/ABC/DEF") => Undefined.  (Not an exact match.)
   * * ("/abc", "/abc/def") => "def"
   * * ("/abc", "/abc/") => ""
   * * ("/abc", "/abc") => ""
   * * ("/abc", "/abc.save/def") => undefined.  (Didn't break on a /.)
   * * ("/abc/", "/abc/def") => Invalid input.  Result is not guaranteed.
   * @param prefix Should start with a /.  Should not end with a /, unless in is only one character long.
   * @param path Should already have the hash, query string, protocol, etc. stripped from it.  I.e. no "#", "?", or "https://".
   */

  static dirPrefix(prefix: string, path: string): string | undefined {
    // TODO should make // equivalent to /.  It's easier if you can just add a / an time you are not sure.
    if (prefix.length > path.length) {
      //console.log("exit 1", prefix, path);
      return;
    }
    const splitChar = path[prefix.length];
    if ((splitChar != "/") && (splitChar !== undefined)) {
      //console.log("exit 2", prefix, path, splitChar);
      return;
    }
    const possibleMatch = path.substring(0, prefix.length);
    if (possibleMatch != prefix) {
      //console.log("exit 3", possibleMatch, prefix, path, splitChar);
      return;
    }
    //console.log("exit success", possibleMatch, prefix, path, splitChar, path.substring(prefix.length));
    return path.substring(prefix.length + 1);
  }

  /**
   * Creates or modifies a headers object which says this result should not be cached.
   * @param headers If given, these will be modified.  Otherwise we will create a new Headers object.
   */

  static disableCache(headers?: Headers): Headers {
    if (!headers) {
      headers = new Headers();
    }
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    headers.set("Cache-Control", "no-store");
    //headers.set("Cache-Control", "max-age=1"); // DO not commit!
    return headers;
  }
}



// TODO
// AugmentedRequest should be a class.
// getRawPath() and getSafePath() should be methods.
// add something similar for the host field.
// Add a way to respond the way we like to with an object turned to json followed by /n.

export function getRawPath(request: AugmentedRequest): string | null {
  return request.searchParams.get("path");
}

export function getSafePath(request: AugmentedRequest): string | undefined {
  let path = request.searchParams.get("path");
  if (!path) {
    return undefined;
  }
  path = path.replaceAll("\\", "/"); // Replace DOS slashes with linux slashes.
  path = path.replaceAll(/\/+/g, "/"); // If you see 2 or more slashes in a row, compress them into a single slash.
  path = path.replace(/(?<=.)\/*$/, ""); // Remove any trailing slashes.  Keep the first character, even if it's a slash.
  return path;
}

export function splitPathTail(fullPath: string) {
  if (fullPath[0] != "/") {
    return;
  }
  const pieces = /^(.*)\/([^\/]+)$/.exec(fullPath);
  if (!pieces) {
    return;
  }
  return { head: pieces[1], tail: pieces[2] };
}
