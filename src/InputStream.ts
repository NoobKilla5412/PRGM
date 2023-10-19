/* eslint-disable */

export class InputStream {
  private pos = 0;
  private line = 1;
  private col = 0;
  private input: string;
  private onError: (err: Error) => void;

  public constructor(input: string, onError = (err: Error) => {}) {
    this.input = input;
    this.onError = onError;
  }

  public next() {
    let ch = this.input.charAt(this.pos++);
    if (ch == "\n") this.line++, (this.col = 0);
    else this.col++;
    return ch;
  }

  public peek() {
    return this.input.charAt(this.pos);
  }

  public eof() {
    return this.peek() == "";
  }

  public croak(msg: string) {
    let err = new Error(`${msg} (${this.line}:${this.col})`);
    // ${"" ?? `${this.input.slice(0, this.pos)}|${this.input.slice(this.pos)}`}`);
    console.error(err);
    this.onError(err);
    return err;
  }
}
