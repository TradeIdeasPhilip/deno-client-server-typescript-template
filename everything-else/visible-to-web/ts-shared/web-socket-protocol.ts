/**
 * This request is typically created by a client then sent to the server.
 */
export class EchoRequest {
  readonly type = "echo";

  /**
   * To be included in the response.
   */
  readonly message : string;

  /**
   * Number of responses.
   */
  readonly repeatCount : number;
  
  /**
   * Time in MS between responses.
   */
  readonly delay : number;

  constructor(message : string, repeatCount : number | string, delay : number | string) {
    if (typeof repeatCount == "string") {
      repeatCount = parseInt(repeatCount);
    }
    if (!isFinite(repeatCount)) {
      throw new Error("Invalid repeatCount");
    }
    if (typeof delay == "string") {
      delay = parseInt(delay);
    }
    if (!isFinite(delay)) {
      throw new Error("Invalid delay");
    }
    this.message = message;
    this.repeatCount = repeatCount;
    this.delay = delay;
  }

  encode() {
    return JSON.stringify(this);
  }

  static decode(s : string) {
    const decoded = JSON.parse(s);
    const { type, message, repeatCount, delay } = decoded;
    if (type !== "echo") {
      throw new Error("invalid input");
    }
    if ((typeof message == "string") && (typeof repeatCount == "number") && (typeof delay == "number")) {
      return new this(message, repeatCount, delay);
    }
    throw new Error("invalid input");
  }

  static tryDecode(input : unknown) {
    if (typeof input === "string") {
      try {
        return this.decode(input);
      } catch {}
    }
    return undefined;
  }
}