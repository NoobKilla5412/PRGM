/* eslint-disable */
import { InputStream } from "./InputStream";

export interface TokenTypes {
  num: number;
  str: string;
  kw: string;
  var: string;
  punc: string;
  op: string;
  char: string;
}

export type Token<T extends keyof TokenTypes> = { type: T; value: TokenTypes[T] };

export namespace TokenTypeChecks {
  export function check<T extends keyof TokenTypes>(type: T, tok: Token<keyof TokenTypes> | undefined): tok is Token<T> {
    return tok && tok.type == type ? true : false;
  }
}

export class TokenStream {
  private current: (Token<keyof TokenTypes> | undefined)[] = [];
  private keywords = new Set([
    "if",
    "then",
    "else",
    "do",
    "_while",
    "while",
    "for",
    "function",
    "object",
    "class",
    "record",
    "static",
    "operator",
    "constructor",
    "extends",
    "import",
    "export",
    "true",
    "false",
    "null",
    "syntax"
  ]);
  public registerKeyword(keyword: string) {
    this.keywords.add(keyword);
  }

  private input: InputStream;

  public constructor(input: InputStream) {
    this.input = input;
  }

  private is_keyword(x: string) {
    return this.keywords.has(x);
  }
  private is_digit(ch: string) {
    return /[0-9]/i.test(ch);
  }
  private is_id_start(ch: string) {
    return /[a-z_]/i.test(ch);
  }
  private is_id(ch: string) {
    return this.is_id_start(ch) || "?!-+/*%<>=0123456789".indexOf(ch) >= 0;
  }
  private is_op_char(ch: string) {
    return ".+-*/%=&|<>!$".indexOf(ch) >= 0;
  }
  private is_punc(ch: string) {
    return ",:;(){}[]".indexOf(ch) >= 0;
  }
  private is_whitespace(ch: string) {
    return " \t\n\r".indexOf(ch) >= 0;
  }
  private read_while(predicate: (ch: string) => boolean) {
    var str = "";
    while (!this.input.eof() && predicate(this.input.peek())) str += this.input.next();
    return str;
  }
  private read_number(): Token<"num"> {
    var has_dot = false;
    var number = this.read_while((ch) => {
      if (ch == ".") {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }
      return this.is_digit(ch);
    });
    return {
      type: "num",
      value: parseFloat(number)
    };
  }
  private read_ident(): Token<"kw" | "var"> {
    var id = this.read_while(this.is_id.bind(this));
    return {
      type: this.is_keyword(id) ? "kw" : "var",
      value: id
    };
  }
  private readonly escapeChars: { [ch: string]: string } = {
    n: "\n"
  };
  private read_escaped(end: string) {
    var escaped = false,
      str = "";
    this.input.next();
    while (!this.input.eof()) {
      var ch = this.input.next();
      if (escaped) {
        if (ch in this.escapeChars) {
          str += this.escapeChars[ch];
        } else str += ch;
        escaped = false;
      } else if (ch == "\\") {
        escaped = true;
      } else if (ch == end) {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }
  private read_string(): Token<"str"> {
    return { type: "str", value: this.read_escaped('"') };
  }
  private read_char(): Token<"char"> {
    return { type: "char", value: this.read_escaped("'") };
  }
  private skip_comment() {
    this.read_while((ch) => {
      return ch != "\n";
    });
    this.input.next();
  }
  private read_next(): Token<keyof TokenTypes> | undefined {
    this.read_while(this.is_whitespace);
    if (this.input.eof()) return;
    var ch = this.input.peek();
    if (ch == "#") {
      this.skip_comment();
      return this.read_next();
    }
    if (ch == '"') return this.read_string();
    if (ch == "'") return this.read_char();
    if (this.is_digit(ch)) return this.read_number();
    if (this.is_id_start(ch)) return this.read_ident();
    if (this.is_punc(ch))
      return {
        type: "punc",
        value: this.input.next()
      };
    if (this.is_op_char(ch))
      return {
        type: "op",
        value: this.read_while(this.is_op_char)
      };
    this.input.croak(`Can't handle character: "${ch}" (Code: ${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")})`);
    return;
  }
  public peek(offset?: number) {
    if (offset) {
      if (this.current.length >= offset) return this.current[offset];
      while (offset > 0) {
        this.current.push(this.read_next());
      }
      return this.current[offset];
    }
    return this.current[0] || (this.current.push(this.read_next()), this.current[0]);
  }
  public next() {
    var tok = this.current.shift();
    return tok || this.read_next();
  }
  public eof() {
    return this.peek() == null;
  }
  public croak(msg: string) {
    return this.input.croak(msg);
  }
}
