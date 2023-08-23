/* eslint-disable */

export class InputStream {
  private pos = 0;
  private line = 1;
  private col = 0;
  private input: string;

  public constructor(input: string) {
    this.input = input;
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

  public croak(msg: string): never {
    throw new Error(`${msg} (${this.line}:${this.col})
${`${this.input.slice(0, this.pos)}|${this.input.slice(this.pos)}`}`);
  }
}
