/* eslint-disable */
import { InputStream } from "./InputStream";
import { Token, TokenStream, TokenTypes } from "./TokenStream";
import { clone } from "./utils";

const FALSE: Expressions["bool"] = { type: "bool", value: false };

export interface Argument {
  // type: Types["type"];
  name: string;
  default: Expression | null;
}

export interface ClassBody {
  prop: { type: "prop"; static: boolean; name: string; value: Expression };
  func: {
    type: "func";
    static: boolean;
    name: string;
    /* returnType: Types["type"]; */ vars: Argument[];
    body: Statements["prog"];
  };
  operator: { type: "operator"; op: string; value: Statements["function"] };
  // constructor: { type: "constructor"; vars: Argument[]; body: Types["prog"] };
}

export namespace ClassUtils {
  export function constructorIndex(obj: Statements["class"]) {
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

export interface Expressions {
  unary: { type: "unary"; operator: string; body: Expression };
  binary: { type: "binary"; operator: string; left: Expression; right: Expression };
  arrayAccess: { type: "arrayAccess"; val: Expression; getter: Expression };
  call: { type: "call"; func: Expression; args: Expression[] };
  functionExpr: { type: "functionExpr"; name?: string; vars: Argument[]; body: Statement };
  classExpr: { type: "classExpr"; name?: string; extendsName: string | null; body: ClassBody[keyof ClassBody][] };
  object: { type: "object"; data: { [key: string]: Expression } };
  null: { type: "null" };
  var: TokenTypes["var"];
  bool: { type: "bool"; value: boolean };
  num: TokenTypes["num"];
  str: TokenTypes["str"];
  char: TokenTypes["char"];

  customSyntaxRtn: CustomSyntaxRtn & { vars: CustomSyntaxVars };
}

export interface Statements {
  // type: { type: "type"; name: string };

  statementExpr: { type: "statementExpr"; expr: Expressions[keyof Expressions] };

  prog: { type: "prog"; prog: Statement[] };
  if: { type: "if"; cond: Expression; then: Statement; else?: Statement };
  do: { type: "do"; cond: Expression; body: Statement };
  _while: { type: "_while"; cond: Expression; body: Statement; else?: Statement };
  while: { type: "while"; cond: Expression; body: Statement; else?: Statement };
  for: { type: "for"; init: Expression; check: Expression; inc: Expression; body: Statement };

  function: { type: "function"; name: string; vars: Argument[]; body: Statement };
  class: { type: "class"; name: string; extendsName: string | null; body: ClassBody[keyof ClassBody][] };
  record: { type: "record"; name: string; vars: Argument[]; body: ClassBody[keyof ClassBody][] };

  import: { type: "import"; value: Expressions["str"] };
  export: { type: "export"; value: Statement };

  customSyntaxRtn: CustomSyntaxRtn & { vars: CustomSyntaxVars };

  // varDeclaration: { type: "varDeclaration"; name: string; value: ASTExpression };
}

export function convertToStatement(expr: Expression): Statements["statementExpr"] {
  return { type: "statementExpr", expr };
}

export type Statement = Statements[keyof Statements];
export type Expression = Expressions[keyof Expressions];

function array_forEach_rtn<T, R>(array: T[], cb: (element: T, index: number, array: T[]) => R) {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const res = cb(element, i, array);
    if (res) return res;
  }
  return undefined;
}

type CustomSyntaxEscape =
  | {
      type: "stmt" | "expr" | "ident";
      name: string;
    }
  | {
      type: "optional" | "repetition";
      body: CustomSyntax[];
    };

type CustomSyntaxRtn = {
  type: "customSyntaxRtn";
  value: Statements["prog"];
};

type CustomSyntaxVars = { [name: string]: Statement };

type CustomSyntax = Token | CustomSyntaxEscape;

export function parse(str: string, onError = (err: Error) => {}, testingFlag = false): Statements["prog"] {
  const input = new TokenStream(new InputStream(str, onError));

  let customExpr = new Map<
    string,
    {
      syntax: CustomSyntax[];
      eval: CustomSyntaxRtn;
    }
  >();
  let customStmt = new Map<
    string,
    {
      syntax: CustomSyntax[];
      eval: CustomSyntaxRtn;
    }
  >();

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
    "%=": 1,

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
  return parse_topLevel();

  function is_punc(ch?: string) {
    var tok = input.peek();
    return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
  }
  function is_kw(kw?: string) {
    var tok = input.peek();
    return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
  }
  function is_var(ident?: string) {
    var tok = input.peek();
    return tok && tok.type == "var" && (!ident || tok.value == ident) && tok;
  }
  function is_op(op?: string) {
    var tok = input.peek();
    return tok && tok.type == "op" && (!op || tok.value == op) && tok;
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
  function unexpected() {
    return input.croak(`Unexpected token: ${JSON.stringify(input.peek())}`);
  }
  function maybe_binary(left: Expression, my_prec: number): Expression {
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
  function maybe_access(left: Expression, my_prec = 0): Expression {
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
  function parse_call(func: Expression): Expression {
    return {
      type: "call",
      func,
      args: delimited("(", ")", ",", parse_expression)
    };
  }
  function parse_arrayAccess(val: Expression): Expression {
    skip_punc("[");
    let getter = parse_expression();
    skip_punc("]");

    return {
      type: "binary",
      left: val,
      operator: "[]",
      right: getter
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
    if (name?.type != "var") {
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
  function parse_if(): Statements["if"] {
    skip_kw("if");
    var cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    var then = parse_statement();
    var ret: Statements["if"] = {
      type: "if",
      cond,
      then
    };
    if (is_punc(";")) input.next();
    if (is_kw("else")) {
      input.next();
      ret.else = parse_statement();
    }
    return ret;
  }
  function parse_do(): Statements["do"] {
    skip_kw("do");
    const body = parse_statement();
    skip_kw("while");
    const cond = parse_expression();
    skip_punc(";");
    return {
      type: "do",
      body,
      cond
    };
  }
  function parse_while(): Statements["while"] {
    skip_kw("while");
    let cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    let body = parse_statement();
    let ret: Statements["while"] = {
      type: "while",
      cond,
      body
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_statement();
    }
    return ret;
  }
  function parse_for(): Statements["for"] {
    skip_kw("for");
    skip_punc("(");
    let init = parse_expression();
    skip_punc(";");
    let check = parse_expression();
    skip_punc(";");
    let inc = parse_expression();
    skip_punc(")");
    let body = parse_statement();
    return {
      type: "for",
      init,
      check,
      inc,
      body
    };
  }
  function parse__while(): Statements["_while"] {
    skip_kw("_while");
    let cond = parse_expression();
    if (!is_punc("{")) skip_kw("then");
    let body = parse_statement();
    let ret: Statements["_while"] = {
      type: "_while",
      cond,
      body
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_statement();
    }
    return ret;
  }
  function parse_export(): Statements["export"] {
    skip_kw("export");
    return {
      type: "export",
      value: parse_statement()
    };
  }
  function parse_import(): Statements["import"] {
    skip_kw("import");
    let value: Expressions["str"] | null = null;
    let tok = input.next();
    if (tok && tok.type == "str") {
      skip_punc(";");
      return {
        type: "import",
        value: tok
      };
    } else input.croak(`Expecting string, but got "${tok?.type}"`);
    return { type: "import", value: { type: "str", value: "" } };
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
  function parse_function(): Statements["function"] | Statements["statementExpr"] {
    skip_kw("function");
    let name = parse_varname();
    if (!name) {
      return convertToStatement(parse_functionExpr());
    }
    let ret: Statements["function"] = {
      type: "function",
      vars: parse_arguments(),
      name,
      body: parse_statement()
    };
    if (name) ret.name = name;
    return ret;
  }
  function parse_functionExpr(): Expressions["functionExpr"] {
    skip_kw("function");
    let ret: Expressions["functionExpr"] = {
      type: "functionExpr",
      vars: parse_arguments(),
      body: parse_statement(false)
    };
    return ret;
  }
  function parse_object(): Expressions["object"] {
    skip_kw("object");
    function parseName() {
      let tok = input.peek();
      if (tok && tok.type == "str") return tok.value;
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
    let data: Expressions["object"]["data"] = {};
    for (const { name, data: _data } of properties) {
      data[name] = _data;
    }
    return {
      type: "object",
      data
    };
  }
  function parse_class(): Statements["class"] {
    skip_kw("class");
    let res: Statements["class"] = {
      type: "class",
      body: [],
      name: parse_varname() /*  (() => {
        let name: string | undefined = undefined;
        let tok = input.peek();
        if (tok && TokenTypeChecks.check("var", tok)) {
          name = tok.value;
          input.next();
        }
        return name;
      })() */,
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
        if (!body) {
          body = convertToStatement(parse_expression()) as unknown as Statements["prog"];
        }
        res.body.push({
          type: "operator",
          op,
          value: {
            type: "function",
            body,
            vars,
            name: ""
          }
        });
      } else if (is_kw("constructor")) {
        input.next();
        res.body.push({
          type: "func",
          name: "constructor",
          vars: parse_arguments(),
          body: (() => {
            let res: Statement | undefined = parse_prog();
            if (!res) res = convertToStatement(parse_expression());
            return res as Statements["prog"];
          })(),
          static: false
        });
      } else {
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
          if (!body) body = convertToStatement(parse_expression()) as unknown as Statements["prog"];
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

  function parse_record() {
    skip_kw("record");
    let res: Statements["record"] = {
      type: "record",
      name: parse_varname(),
      body: [],
      vars: parse_arguments()
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
        if (!body) {
          body = convertToStatement(parse_expression()) as unknown as Statements["prog"];
        }
        res.body.push({
          type: "operator",
          op,
          value: {
            type: "function",
            body,
            vars,
            name: ""
          }
        });
      } /* else if (is_kw("constructor")) {
        input.next();
        res.body.push({
          type: "func",
          name: "constructor",
          vars: parse_arguments(),
          body: (() => {
            let res: ASTStatement | undefined = parse_prog();
            if (!res) res = convertToStatement(parse_expression());
            return res as Statements["prog"];
          })(),
          static: false
        });
      } */ else {
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
          if (!body) body = convertToStatement(parse_expression()) as unknown as Statements["prog"];
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

  function parse_bool(): Expressions["bool"] {
    return {
      type: "bool",
      value: input.next()!.value == "true"
    };
  }
  function parse_null(): Expressions["null"] {
    skip_kw("null");
    return {
      type: "null"
    };
  }
  function maybe_call(expr: () => Expression): Expression {
    const res = expr();
    return is_punc("(") ? parse_call(res) : res;
  }
  function maybe_arrayAccess(expr: () => Expression | undefined): Expression {
    let res = expr();
    if (!res) res = { type: "null" };
    return is_punc("[") ? parse_arrayAccess(res) : res;
  }
  // function maybe_varDeclaration(expr: () => AST): AST {
  //   const res = expr();
  //   return input.peek()?.type == "var" && res.type == "var" ? parse_varDeclaration(res) : res;
  // }
  function parse_atom(): Expression {
    return maybe_call(() => maybe_arrayAccess(() => parse_atom_withoutCall()));
  }
  function parse_atom_withoutCall() {
    let left: Expression | undefined = maybe_arrayAccess(() => {
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

      if (is_kw("true") || is_kw("false")) return parse_bool();
      if (is_kw("null")) return parse_null();

      if (is_kw("object")) return parse_object();

      if (is_kw("function")) {
        return parse_functionExpr();
      }

      // if (is_kw("export")) return parse_export();

      var tok = input.next();
      if (tok && (tok.type == "var" || tok.type == "num" || tok.type == "str" || tok.type == "char")) return tok;
      unexpected();
      return;
    });
    if (!left) left = { type: "null" };
    return maybe_access(left);
  }
  // function needsSemicolon(expr: ASTStatement) {
  //   return (
  //     is_punc(";") ||
  //     (expr.type != "if" &&
  //       expr.type != "prog" &&
  //       !(expr.type == "class" && expr.name) &&
  //       expr.type != "_while" &&
  //       expr.type != "while" &&
  //       !(expr.type == "function" && expr.name))
  //   );
  // }
  function parse_topLevel(): Statements["prog"] {
    var prog: Statement[] = [];
    while (!input.eof()) {
      let expr = parse_statement();
      prog.push(expr);
      // if (!input.eof()) skip_punc(";");
    }
    return { type: "prog", prog };
  }
  function parse_prog(): Statements["prog"] | undefined {
    if (!is_punc("{")) return;
    skip_punc("{");
    var prog: Statement[] = [];
    while (!input.eof() && !is_punc("}")) {
      let statement = parse_statement();
      prog.push(statement);
    }
    skip_punc("}");
    // if (prog.length == 0) return FALSE;
    // if (prog.length == 1) return prog[0];
    return { type: "prog", prog: prog };
  }
  function parse_expression(replace?: { [key: string]: Expression }): Expression {
    if (replace)
      if (is_punc("$")) {
        let name = parse_varname();
        if (name in replace) {
          return clone(replace[name]);
        }
      }

    let _res = parse_customSyntax("expr");
    if (_res) {
      return _res;
    }

    return maybe_call(() => {
      return maybe_binary(parse_atom(), 0);
    });
  }

  function parse_customSyntax(type: "expr"): Expression | null;
  function parse_customSyntax(type: "stmt"): Statement | null;
  function parse_customSyntax(type: "stmt" | "expr"): (CustomSyntaxRtn & { vars: CustomSyntaxVars }) | null {
    let tok = input.peek();
    let customSyntax = type == "stmt" ? customStmt : customExpr;

    if ((tok?.type == "var" || tok?.type == "kw") && customSyntax.has(tok.value)) {
      let { syntax: _syntax, eval: _rtn } = customSyntax.get(tok.value)!;
      let syntax = [..._syntax];
      let rtn = { ..._rtn };
      let vars: CustomSyntaxVars = {};

      if (syntax[0].type != "var" && syntax[0].type != "kw") {
        return null;
      }

      input.next();
      syntax.shift();

      function evaluateSyntaxBody(syntax: CustomSyntax[]) {
        while (syntax.length > 0) {
          let current = syntax.shift()!;
          if ("name" in current) {
            switch (current.type) {
              case "stmt":
                vars[current.name] = parse_statement();
                break;
              case "expr":
                vars[current.name] = convertToStatement(parse_expression());
                break;
              case "ident":
                let currentRes: Expressions["var"] = {
                  type: "var",
                  value: parse_varname()
                };

                vars[current.name] = convertToStatement(currentRes);
                break;
            }
          } else if ("body" in current) {
            switch (current.type) {
              case "optional": {
                let { body: _body } = current;
                let body = [..._body];
                let tok = input.peek();
                if (tok?.type == body[0].type && tok.value == body[0].value) {
                  evaluateSyntaxBody(body.slice(1));
                }
                break;
              }
              case "repetition": {
                let { body: _body } = current;
                let body = [..._body];
                let tok = input.peek();
                while (tok?.type == body[0].type && tok.value == body[0].value) {
                  input.next();
                  evaluateSyntaxBody(body.slice(1));
                  tok = input.peek();
                }
                break;
              }
            }
          } else {
            let tok = input.peek();

            if (tok?.type == current.type && tok.value == current.value) {
              input.next();
            } else input.croak(`Expecting token of type ${current.type} and value of ${current.value}`);
          }
        }
      }

      evaluateSyntaxBody(syntax);

      return { ...rtn, vars };
    }
    return null;
  }

  function parse_statement(requireSemiColon = true): Statement {
    const ret: Statement = { type: "statementExpr", expr: { type: "null" } };

    let res: Statement;

    if (is_punc("{")) {
      let _res = parse_prog();
      if (_res) res = _res;
    } else if (is_kw("if")) res = parse_if();
    else if (is_kw("do")) res = parse_do();
    else if (is_kw("_while")) res = parse__while();
    else if (is_kw("while")) res = parse_while();
    // else if (is_kw("for")) res = parse_for();
    // let tok = input.peek();
    // let tok1 = input.peek(1);
    // if (tok?.type == "str" && tok1?.type == "op" && tok1.value == "=") {
    //   return parse_varDeclaration();
    // }
    else if (is_kw("function")) res = parse_function();
    else if (is_kw("class")) res = parse_class();
    else if (is_kw("record")) res = parse_record();
    else if (is_kw("import")) res = parse_import();
    else if (is_kw("export")) res = parse_export();
    else if (is_kw("syntax")) {
      return parse_syntaxDef();
      // res = { type: "statementExpr", expr: { type: "null" } };
    } else {
      let _res = parse_customSyntax("stmt");
      if (_res) {
        res = _res;
      }
    }

    if (typeof res! == "undefined") {
      let expr = parse_expression();
      if (expr) {
        // TODO: Fix the semi-colon error
        if (requireSemiColon && expr.type != "customSyntaxRtn") skip_punc(";");
        res = convertToStatement(expr);
      }
    }

    if (res!) {
      if (is_punc(";")) {
        unexpected();
        input.next();
      }
      return res;
    }

    unexpected();
    return ret;
  }

  function parse_syntaxDef() {
    const ret: Statements["statementExpr"] = { type: "statementExpr", expr: { type: "null" } };

    skip_kw("syntax");

    function parseSyntaxBody(): { type: "expr" | "stmt"; body: CustomSyntax[] } | undefined {
      let numOfNames = 0;

      let tokens: CustomSyntax[] = [];
      let parenCount = 1;
      let type: "expr" | "stmt" = "expr";

      function parseSyntaxEscape(): CustomSyntaxEscape | null {
        let escapes: {
          [key: string]: "optional" | "repetition";
        } = {
          "[]": "optional",
          "{}": "repetition"
        };

        for (const key in escapes) {
          if (Object.prototype.hasOwnProperty.call(escapes, key)) {
            const element = escapes[key];
            for (const char of key) {
              if (is_punc(char)) {
                input.next();
                let body: CustomSyntax[] = [];

                ({ body } = parseSyntaxBody()!);
                skip_punc("$");
                skip_punc(key[1]);

                if (
                  body[0].type == "expr" ||
                  body[0].type == "stmt" ||
                  body[0].type == "ident" ||
                  body[0].type == "optional" ||
                  body[0].type == "repetition"
                ) {
                  return null;
                }
                return {
                  body,
                  type: element
                };
              }
            }
          }
        }

        // if (is_punc("[")) {
        //   input.next();

        //   return {
        //     name: "[",
        //     type: "optional"
        //   };
        // } else if (is_punc("]")) {
        //   input.next();
        //   return {
        //     name: "]",
        //     type: "optional"
        //   };
        // } else if (is_punc("{")) {
        //   input.next();
        //   return {
        //     name: "{",
        //     type: "repetition"
        //   };
        // } else if (is_punc("}")) {
        //   input.next();
        //   return {
        //     name: "}",
        //     type: "repetition"
        //   };
        // }
        let type = parse_varname();
        if (["stmt", "expr", "ident"].includes(type)) {
          let name = "_" + ++numOfNames;
          if (is_punc("{")) {
            input.next();
            name = parse_varname();
            skip_punc("}");
          }
          return {
            // @ts-ignore We know it is the requested type due to `Array.includes(type)`.
            type,
            name
          };
        } else {
          input.croak('Unknown syntax type "' + type + '"');
        }
        return null;
      }

      if (is_punc("(")) {
        // this is a new expression
        skip_punc("(");
        type = "expr";
        while (!input.eof()) {
          let tok = input.next();
          if (!tok) break;
          if (tok.type == "punc") {
            if (tok.value == "(") parenCount++;
            else if (tok.value == ")") parenCount--;
            else if (tok.value == "$") {
              let name = parseSyntaxEscape();
              if (name) tokens.push(name);
              continue;
            }
          }
          if (parenCount <= 0) break;
          tokens.push(tok);
        }
      } else if (is_punc("{")) {
        // this is a new statement
        skip_punc("{");
        type = "stmt";
        while (!input.eof()) {
          let tok = input.next();
          if (!tok) break;
          if (tok.type == "punc") {
            if (tok.value == "{") parenCount++;
            else if (tok.value == "}") parenCount--;
            else if (tok.value == "$") {
              let name = parseSyntaxEscape();
              if (name) tokens.push(name);
              continue;
            }
          }
          if (parenCount <= 0) break;
          tokens.push(tok);
        }
      }

      if (tokens[0].type != "kw" && tokens[0].type != "var") {
        input.croak('Cannot have type "' + tokens[0].type + '" at the start of a custom syntax.');
        return;
      }

      return {
        type,
        body: tokens
      };
    }

    let body = parseSyntaxBody();
    if (!body) return ret;
    let { type, body: tokens } = body;

    let evaluation = parse_prog();
    if (!evaluation) {
      input.croak("Missing body");
    } else if (type == "expr") {
      // @ts-ignore
      customExpr.set(tokens[0].value.toString(), {
        syntax: tokens,
        eval: {
          type: "customSyntaxRtn",
          value: evaluation
        }
      });
    } else if (type == "stmt") {
      // @ts-ignore
      customStmt.set(tokens[0].value.toString(), {
        syntax: tokens,
        eval: {
          type: "customSyntaxRtn",
          value: evaluation
        }
      });
    }

    return ret;
  }

  // function parse_varDeclaration(): Statements["varDeclaration"] {
  //   let name = parse_varname();
  //   skip_op("=");
  //   let value = parse_expression();
  //   skip_punc(";");
  //   return {
  //     type: "varDeclaration",
  //     name,
  //     value
  //   };
  // }
}
