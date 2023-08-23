/* eslint-disable */
import { InputStream } from "./InputStream";
import { Token, TokenStream, TokenTypeChecks } from "./TokenStream";

const FALSE: AST = { type: "bool", value: false };

export interface Argument {
  // type: Types["type"];
  name: string;
  default: AST | null;
}

export interface ClassBody {
  prop: { type: "prop"; static: boolean; name: string; /* varType: Types["type"]; */ value: AST };
  func: {
    type: "func";
    static: boolean;
    name: string;
    /* returnType: Types["type"]; */ vars: Argument[];
    body: Types["prog"];
  };
  operator: { type: "operator"; op: string; value: Types["function"] };
  // constructor: { type: "constructor"; vars: Argument[]; body: Types["prog"] };
}

export namespace ClassUtils {
  export function constructorIndex(obj: Types["class"]) {
    for (let i = 0; i < obj.body.length; i++) {
      const element = obj.body[i];
      if (element.type == "func" && element.name == "constructor") return i;
    }
    return -1;
  }
}

// export interface VarDeclaration {
//   normal: { type: "normal"; varType: Types["type"]; name: string; value: AST };
// }

export interface Types {
  // type: { type: "type"; name: string };

  unary: { type: "unary"; operator: string; body: AST };
  binary: { type: "binary"; operator: string; left: AST; right: AST };
  call: { type: "call"; func: AST; args: AST[] };

  prog: { type: "prog"; prog: AST[] };
  if: { type: "if"; cond: AST; then: AST; else?: AST };
  do: { type: "do"; cond: AST; body: AST };
  _while: { type: "_while"; cond: AST; body: AST; else?: AST };
  while: { type: "while"; cond: AST; body: AST; else?: AST };

  // functionExp: { type: "functionExp"; name?: string; vars: Argument[]; body: AST };
  function: { type: "function"; name?: string; /* returnType: Types["type"]; */ vars: Argument[]; body: AST };
  object: { type: "object"; data: { [key: string]: AST } };
  class: { type: "class"; name?: string; extendsName: string | null; body: ClassBody[keyof ClassBody][] };

  import: { type: "import"; value: Types["str"] };
  export: { type: "export"; value: AST };

  // varDeclaration: { type: "varDeclaration"; value: VarDeclaration[keyof VarDeclaration] };

  null: { type: "null" };
  var: Token<"var">;
  bool: { type: "bool"; value: boolean };
  num: Token<"num">;
  str: Token<"str">;
  char: Token<"char">;
}

export type AST = Types[keyof Types];

function array_forEach_rtn<T, R>(array: T[], cb: (element: T, index: number, array: T[]) => R) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const res = cb(element, i, array);
    if (res) return res;
  }
  return undefined;
}

export function parse(str: string, testingFlag = false): Types["prog"] {
  const input = new TokenStream(new InputStream(str));

  if (testingFlag) {
    // @ts-ignore
    input.croak = (msg) => {};
  }

  const UNARY_OPS = ["!", "-"];
  const PRECEDENCE: {
    [op: string]: number;
    "=": 1;
    "||": 2;
    "&&": 3;
    "<": 7;
    ">": 7;
    "<=": 7;
    ">=": 7;
    "==": 7;
    "!=": 7;
    "+": 10;
    "-": 10;
    "*": 20;
    "/": 20;
    "%": 20;
    ".": 21;
  } = {
    "=": 1,
    "+=": 1,
    "-=": 1,
    "/=": 1,
    "*=": 1,

    "||": 2,
    "&&": 3,

    "<": 7,
    ">": 7,
    "<=": 7,
    ">=": 7,
    "==": 7,
    "!=": 7,

    "+": 10,
    "-": 10,
    "*": 20,
    "/": 20,
    "%": 20,

    ".": 21
  };
  let res = parse_topLevel();
  console.log("res: ", res);
  return res;

  function is_punc(ch?: string) {
    var tok = input.peek();
    return tok && TokenTypeChecks.check("punc", tok) && (!ch || tok.value == ch) && tok;
  }
  function is_kw(kw?: string) {
    var tok = input.peek();
    return tok && TokenTypeChecks.check("kw", tok) && (!kw || tok.value == kw) && tok;
  }
  function is_op(op?: string) {
    var tok = input.peek();
    return tok && TokenTypeChecks.check("op", tok) && (!op || tok.value == op) && tok;
  }
  function skip_punc(ch: string) {
    if (is_punc(ch)) input.next();
    else input.croak(`Expecting punctuation: "${ch}"`);
  }
  function skip_kw(kw: string) {
    if (is_kw(kw)) input.next();
    else input.croak(`Expecting keyword: "${kw}"`);
  }
  function skip_op(op: string) {
    if (is_op(op)) input.next();
    else input.croak(`Expecting operator: "${op}"`);
  }
  function unexpected(): never {
    return input.croak(`Unexpected token: ${JSON.stringify(input.peek())}`);
  }
  function maybe_binary(left: AST, my_prec: number): AST {
    var tok = is_op();
    if (tok) {
      var his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        return maybe_binary(
          {
            type: "binary",
            operator: tok.value,
            left: left,
            right: maybe_binary(parse_atom(), his_prec)
          },
          my_prec
        );
      }
    }
    return left;
  }
  function maybe_access(left: AST, my_prec = 0): AST {
    var tok = is_op(".");
    if (tok) {
      var his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        return maybe_access(
          {
            type: "binary",
            operator: tok.value,
            left,
            right: maybe_access(parse_atom_withoutCall(), his_prec)
          },
          my_prec
        );
      }
    }
    return left;
  }
  function delimited<T>(start: string, stop: string, separator: string, parser: () => T) {
    var a: T[] = [],
      first = true;
    skip_punc(start);
    while (!input.eof()) {
      if (is_punc(stop)) break;
      if (first) first = false;
      else skip_punc(separator);
      if (is_punc(stop)) break;
      a.push(parser());
    }
    skip_punc(stop);
    return a;
  }
  function parse_call(func: AST): AST {
    return {
      type: "call",
      func: func,
      args: delimited("(", ")", ",", parse_expression)
    };
  }
  // function parse_type(): Types["type"] {
  //   return {
  //     type: "type",
  //     name: parse_varname()
  //   };
  // }
  function parse_varname(): string {
    var name = input.next();
    if (!TokenTypeChecks.check("var", name)) {
      input.croak("Expecting variable name");
      return "";
    }
    return name.value;
  }
  // function parse_varDeclaration(type: AST): Types["varDeclaration"] {
  //   const name = parse_varname();
  //   let value: AST;
  //   if (is_punc("(")) {
  //     let vars = parse_arguments();
  //   }
  //   if (!is_op("=")) {
  //   } else {
  //     skip_op("=");
  //     value = parse_expression();
  //   }
  //   return {
  //     type: "varDeclaration",
  //     value: {
  //       type: "normal",
  //       name
  //     }
  //   };
  // }
  function parse_if(): Types["if"] {
    skip_kw("if");
    var cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    var then = parse_expression();
    var ret: Types["if"] = {
      type: "if",
      cond: cond,
      then: then
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }
  function parse_do(): Types["do"] {
    skip_kw("do");
    const body = parse_expression();
    skip_kw("while");
    const cond = parse_expression();
    return {
      type: "do",
      body,
      cond
    };
  }
  function parse_while(): Types["while"] {
    skip_kw("while");
    let cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    let body = parse_expression();
    let ret: Types["while"] = {
      type: "while",
      cond,
      body
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }
  function parse__while(): Types["_while"] {
    skip_kw("_while");
    let cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    let body = parse_expression();
    let ret: Types["_while"] = {
      type: "_while",
      cond,
      body
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }
  // function parse_export(): Types["export"] {
  //   skip_kw("export");
  //   return {
  //     type: "export",
  //     value: parse_expression()
  //   };
  // }
  function parse_import(): Types["import"] {
    skip_kw("import");
    let value: Types["str"] | null = null;
    let tok = input.next();
    if (tok && TokenTypeChecks.check("str", tok))
      return {
        type: "import",
        value: tok
      };
    else input.croak(`Expecting string, but got "${tok?.type}"`);
    return { type: "import", value: { type: "str", value: "" } }; // This should never happen
  }
  function parse_argument() {
    let rtn: Argument = {
      name: parse_varname(),
      default: null
    };
    if (is_op("=")) {
      input.next();
      rtn.default = parse_expression();
    }
    return rtn;
  }
  function parse_arguments() {
    return delimited("(", ")", ",", parse_argument);
  }
  function parse_function(): Types["function"] {
    skip_kw("function");
    let name: string | undefined = undefined;
    let tok = input.peek();
    if (tok && TokenTypeChecks.check("var", tok)) {
      name = tok.value;
      input.next();
    }
    let ret: Types["function"] = {
      type: "function",
      vars: parse_arguments(),
      name,
      body: parse_expression()
    };
    if (name) ret.name = name;
    return ret;
  }
  function parse_object(): Types["object"] {
    skip_kw("object");
    function parseName() {
      let tok = input.peek();
      if (tok && TokenTypeChecks.check("str", tok)) return tok.value;
      else return parse_varname();
    }

    const properties = delimited("{", "}", ",", () => {
      let name = parseName();
      skip_punc(":");
      let data = parse_expression();
      return {
        name,
        data
      };
    });
    let data: Types["object"]["data"] = {};
    for (const { name, data: _data } of properties) {
      data[name] = _data;
    }
    return {
      type: "object",
      data
    };
  }
  function parse_class(): Types["class"] {
    skip_kw("class");
    let res: Types["class"] = {
      type: "class",
      body: [],
      name: (() => {
        let name: string | undefined = undefined;
        let tok = input.peek();
        if (tok && TokenTypeChecks.check("var", tok)) {
          name = tok.value;
          input.next();
        }
        return name;
      })(),
      extendsName: is_kw("extends") ? (skip_kw("extends"), parse_varname()) : null
    };

    skip_punc("{");

    while (!input.eof()) {
      if (is_punc("}")) break;
      if (is_kw("operator")) {
        input.next();
        let op = "";
        if (is_op()) {
          op = input.next()!.value.toString();
        } else if (is_punc("[")) {
          input.next();
          skip_punc("]");
          op = "[]";
        } else {
          op = parse_varname();
        }
        let vars = parse_arguments();
        let body = parse_prog();
        res.body.push({
          type: "operator",
          op,
          value: {
            type: "function",
            body,
            vars
          }
        });
      } else if (is_kw("constructor")) {
        input.next();
        res.body.push({
          type: "func",
          name: "constructor",
          vars: parse_arguments(),
          body: parse_prog(),
          static: false
        });
      } else {
        // let varType = parse_type();
        let isStatic = false;
        if (is_kw("static")) {
          input.next();
          isStatic = true;
        }
        let name = parse_varname();
        let vars = is_punc("(") ? parse_arguments() : null;
        if (vars) {
          // We have a function
          let body = parse_prog();
          res.body.push({
            type: "func",
            body,
            name,
            vars,
            static: isStatic
          });
        } else {
          // We have a property
          skip_op("=");
          let value = parse_expression();
          res.body.push({
            type: "prop",
            name,
            value,
            static: isStatic
          });
          skip_punc(";");
        }
      }
    }

    skip_punc("}");

    return res;
  }
  function parse_bool(): Types["bool"] {
    return {
      type: "bool",
      value: input.next()!.value == "true"
    };
  }
  function parse_null(): Types["null"] {
    skip_kw("null");
    return {
      type: "null"
    };
  }
  function maybe_call(expr: () => AST): AST {
    const res = expr();
    return is_punc("(") ? parse_call(res) : res;
  }
  // function maybe_varDeclaration(expr: () => AST): AST {
  //   const res = expr();
  //   return input.peek()?.type == "var" && res.type == "var" ? parse_varDeclaration(res) : res;
  // }
  function parse_atom(): AST {
    return maybe_call(() => parse_atom_withoutCall());
  }
  function parse_atom_withoutCall() {
    return maybe_access(
      (() => {
        if (is_punc("(")) {
          input.next();
          var exp = parse_expression();
          skip_punc(")");
          return exp;
        }

        // unary operators
        let op = array_forEach_rtn(UNARY_OPS, (element) => is_op(element));
        if (op) {
          input.next();
          return {
            type: "unary",
            operator: op.value,
            body: parse_atom()
          };
        }
        // end unary operators

        if (is_punc("{")) return parse_prog();

        if (is_kw("if")) return parse_if();
        if (is_kw("do")) return parse_do();
        if (is_kw("_while")) return parse__while();
        if (is_kw("while")) return parse_while();

        if (is_kw("true") || is_kw("false")) return parse_bool();
        if (is_kw("null")) return parse_null();

        if (is_kw("function")) return parse_function();
        if (is_kw("object")) return parse_object();
        if (is_kw("class")) return parse_class();

        // if (is_kw("export")) return parse_export();
        if (is_kw("import")) return parse_import();

        var tok = input.next();
        if (
          tok &&
          (TokenTypeChecks.check("var", tok) ||
            TokenTypeChecks.check("num", tok) ||
            TokenTypeChecks.check("str", tok) ||
            TokenTypeChecks.check("char", tok))
        )
          return tok;
        unexpected();
      })()
    );
  }
  function needsSemicolon(expr: AST) {
    return (
      is_punc(";") ||
      (expr.type != "if" &&
        expr.type != "prog" &&
        !(expr.type == "class" && expr.name) &&
        expr.type != "_while" &&
        expr.type != "while" &&
        expr.type != "object" &&
        !(expr.type == "function" && expr.name))
    );
  }
  function parse_topLevel(): Types["prog"] {
    var prog: AST[] = [];
    while (!input.eof()) {
      let expr = parse_expression();
      prog.push(expr);
      if (!input.eof() && needsSemicolon(expr)) skip_punc(";");
    }
    return { type: "prog", prog: prog };
  }
  function parse_prog(): Types["prog"] {
    skip_punc("{");
    var prog: AST[] = [];
    while (!input.eof() && !is_punc("}")) {
      let expr = parse_expression();
      prog.push(expr);
      if (needsSemicolon(expr)) skip_punc(";");
    }
    skip_punc("}");
    // if (prog.length == 0) return FALSE;
    // if (prog.length == 1) return prog[0];
    return { type: "prog", prog: prog };
  }
  function parse_expression(): AST {
    return maybe_call(() => {
      return maybe_binary(parse_atom(), 0);
    });
  }
}
