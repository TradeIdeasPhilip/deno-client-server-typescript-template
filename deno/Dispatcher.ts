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

type Action = (request: AugmentedRequest) => Promise<boolean>;

type PrefixAction = (request: AugmentedRequest, remainder: string) => Promise<boolean>;

type FilePreviewAction = (fileName : string, request: AugmentedRequest) => Promise<boolean>;

export class WebServer {
  private static readonly BREAK_QUERY_STRING = /^([^?]*)(\??.*)$/;
  private task: Promise<void> | undefined;
  private readonly actions: Action[] = [];
  public notFound(req: AugmentedRequest) {
    req.respond({ body: "404\n" }); // TODO set return code
  }

  /**
   * Expected use:  run() will call handleRequest() as soon as we get a request.
   * handleRequest() might or might not get put to sleep.
   * handleRequest() returns a promise but there's no good reason to wait on it.
   * @param request Respond to this request one way or another.
   */
  private async handleRequest(request : AugmentedRequest) {
    const regexpResult = WebServer.BREAK_QUERY_STRING.exec(request.url)!;
    request.path = WebServer.sanitize(regexpResult[1]);
    console.log(request.path, new Date());
    request.searchParams = new URLSearchParams(regexpResult[2]);
    let handled = false;
    for (const action of this.actions) {
      handled = await action(request);
      if (handled) {
        break;
      }
    }
    if (!handled) {
      this.notFound(request);
    }
  }

  private async run() {
    const s = serve({ port: 9000 });
    for await (const req of s) {
      this.handleRequest(req as AugmentedRequest);
    }
  }

  public addAction(action: Action): void {
    this.actions.push(action);
  }

  public addPrefixAction(urlPrefix: string, action: PrefixAction) {
    this.addAction((request: AugmentedRequest): Promise<boolean> => {
      // Note:  the "?" part of the query has already been removed from request.path and moved
      // to request.searchParams.  The prefix "/abc" will match the query "http://127.0.0.1:8000/abc?de=fg".
      const remainder = WebServer.dirPrefix(urlPrefix, request.path);
      if (remainder === undefined) {
        return Promise.resolve(false);
      } else {
        action(request, remainder);
        return Promise.resolve(true);
      }
    });
  }

  /**
   * Add a rule to copy some files as is.
   * @param urlPrefix What to look for in the url.  e.g. "/static" if you want to capture http://127.0.0.1:9000/static/
   * and http://127.0.0.1:9000/static/ts/index.js
   * @param filePrefix Where to look for files.  e.g. "../everything-else/visible-to-web/" if you want to expose
   * ../everything-else/visible-to-web/index.html and ../everything-else/visible-to-web/ts/index.js.
   */
  public addFileHandler(urlPrefix: string, filePrefix: string, preview? : FilePreviewAction): void {
    this.addPrefixAction(
      urlPrefix,
      async (request: AugmentedRequest, remainder: string) : Promise<boolean> => {
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
        if (preview && await preview(localFile, request)) {
          // The preview action took care of the request.
          return true;
        }
        if (await tryOnce(localFile)) {
          // Success!
          return true;
        }
        if ((!/\/index.html$/.test(localFile)) && (await tryOnce(localFile + "/index.html"))) {
          // Success, after adding /index.html.
          return true;
        }
        console.log("404", localFile);
        return false;
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
