/* eslint-disable */
import {
  ASTExpression,
  ASTStatement,
  Argument,
  ClassBody,
  ClassUtils,
  Expressions,
  Statements,
  convertToStatement,
  parse
} from "../parse";
import { useUtils } from "../utils";
import { Environment } from "./Environment";

useUtils();

// export const _whileLoops: { loop: Types["_while"]; env: Environment; i: number; pid: number }[] = [];
// export const doWhileLoops: { loop: Types["do"]; env: Environment; i: number }[] = [];

// export async function evalTestEnv(prgm: string | AST, pid: number) {
//   let globalEnv = Environment.testEnv();
//   let prog = typeof prgm == "string" ? parse(prgm) : prgm;
//   return await evaluate(prog, globalEnv, pid);
// }

// @ts-ignore

// async function awaitDeletion(array: any[], element: any) {
//   return new Promise<void>((resolve) => {
//     const interval = setInterval(() => {
//       if (!array.includes(element)) {
//         clearInterval(interval);
//         resolve();
//       }
//     });
//   });
// }

export class PRGM_String {
  async toString(): Promise<string> {
    return "";
  }
}

export function duplicateObj<T>(obj: T) {
  let res: any = obj;
  if (Array.isArray(obj)) {
    // @ts-ignore
    res = obj.toSpliced(0, 0);
  } else if (typeof obj == "object") {
    res = {};
    for (const key in obj) {
      const element = obj[key];
      res[key] = duplicateObj(element);
    }
  }
  return res as T;
}

export const classOperators = Symbol("ops");
interface PRGM_Class {
  [classOperators]: { [op: string]: Function };
}

export async function evaluate(
  exp: ASTStatement,
  env: Environment,
  pid: number,
  _path: string,
  onExit = (code: number) => {},
  onError = (err: Error) => {}
): Promise<any> {
  // async function syncAsyncLoop(loop: () => void | Promise<void>, cond: () => boolean | Promise<boolean>) {
  //   return new Promise<void>((resolve) => {
  //     const interval = setInterval(async () => {
  //       if (await cond()) {
  //         await loop();
  //       } else {
  //         clearInterval(interval);
  //         resolve();
  //       }
  //     });
  //   });
  // }

  function throwGood(error: Error) {
    onError(error);
    console.error(error);
    return error;
  }

  /**
   * Dot operator
   * @param target the var to dot operator the var_
   * @param var_ The property
   * @returns The property value
   */
  function applyVar(target: any, var_: ASTExpression): [any, any, string] {
    if (var_.type == "binary" && var_.left.type == "var") {
      return applyVar(target[var_.left.value], var_.right);
    } else if (var_.type == "var") {
      return [target, target[var_.value], var_.value];
    }
    throwGood(new TypeError("Invalid dot operator"));
    return [{}, null, ""];
  }

  async function evalDot(env: Environment, exp: Expressions["binary"], path: string) {
    // if (exp.right.type != "var" && !(exp.right.type == "binary" && exp.operator == "."))
    //   throwGood(new TypeError(`Cannot read property ${JSON.stringify(exp, undefined, 2)}`));
    // if (exp.left.type == "call") exp.left = await evaluate(exp.left, env, testingFlag);

    if (exp.left.type == "call" && exp.right.type == "call") {
      let res = await mainExp(exp.left, env, path);
      if (exp.right.func.type == "var") {
        return await call(res[exp.right.func.value], exp.right.args, env, path);
      } else throwGood(new SyntaxError("Syntax error"));
    }

    // let tmp = await collapseDotOp(exp, env, path);

    // const target = tmp ?? (await main(exp.left, env, path));
    // let value = "";
    // if (tmp && exp.right.type == "binary" && exp.right.right.type == "var") value = exp.right.right.value;
    // else if (exp.right.type == "var") value = exp.right.value;

    // if (target == undefined) {
    //   throwGood(new TypeError(`Cannot read properties of undefined (reading '${value}')`));
    //   return false;
    // }
    // let res = target[value];
    let [target, res] = applyVar(await mainExp(exp.left, env, path), exp.right);
    if (res === undefined) res = null;
    if (typeof res == "function") res = res.bind(target);
    return res;
  }

  // function getName(exp: ASTStatement): string | undefined {
  //   switch (exp.type) {
  //     case "function":
  //       return exp.name;
  //     case "call":
  //       return getName(exp.func);
  //     case "class":
  //       return exp.name;
  //     case "binary":
  //       if (exp.operator == "=") {
  //         return getName(exp.left);
  //       }
  //       return undefined;
  //     case "null":
  //       return "null";
  //     case "var":
  //       return exp.value;
  //     default:
  //       return undefined;
  //   }
  // }

  // function isAST(exp: any): exp is ASTStatement {
  //   return typeof exp == "object" && exp && "type" in exp;
  // }

  function buildPath(file: string, path: string) {
    return file.startsWith("/") ? file + ".prgm" : `${path}/${file}.prgm`;
  }

  async function _import(exp: Statements["import"], env: Environment, path = _path) {
    let code = "";
    while (path.startsWith("//")) path = path.slice(1);
    let builtPath = buildPath(exp.value.value, path);
    // console.log(builtPath);
    if (typeof fetch != "undefined") {
      // let url = "../../standardLibrary/" + builtPath.split("/").splice(2).join("/");
      // console.log(require(url));
      if (builtPath.startsWith("/std/")) {
        code = await (await fetch(require("../../standardLibrary/" + builtPath.split("/").splice(2).join("/")))).text();
      } else code = await (await fetch(builtPath)).text();
    } else {
      const os = await import("os");
      const path = await import("path");
      const fs = await import("fs");
      let basePath = "";
      if (process.platform == "win32") {
        basePath = path.join(os.homedir(), "AppData\\Roaming\\npm\\node_modules\\prgm-lang");
      }
      // console.log(process.execPath);
      // console.log(path.join(basePath, "standardLibrary", builtPath.split("/").splice(2).join("/")));
      if (builtPath.startsWith("/std/")) {
        code = fs.readFileSync(path.join(basePath, "standardLibrary", builtPath.split("/").splice(2).join("/"))).toString();
      } else code = fs.readFileSync(builtPath).toString();
    }
    const ast = parse(code);
    let newPath = exp.value.value.split("/").slice(0, -1).join("/");
    if (!newPath.startsWith("/")) newPath = "/" + newPath;
    // console.log(ast);
    /* const [exports] = <[Types["export"][]]> */ await main(ast, env, path + newPath);
    // for (const exportedItem of exports) {
    //   const name = getName(exportedItem.value);
    //   if (name) {
    //     env.def(name, await evaluate(exportedItem.value, env, testingFlag));
    //   }
    // }
  }

  async function collapseDotOp(exp: Expressions["binary"], env: Environment, path: string) {
    if (exp.operator != ".") return undefined;
    if (exp.right.type == "binary" && exp.right.operator == ".") {
      const leftTarget = await mainExp(
        {
          type: "binary",
          operator: ".",
          left: exp.left,
          right: exp.right.left
        },
        env,
        path
      );
      return leftTarget;
    }
  }
  async function overloadOp(op: string, a: any, b: any) {
    if (typeof a == "object" && a != null && a[classOperators] && op in a[classOperators])
      return await a[classOperators][op](b);
    else if (typeof b == "object" && b != null && b[classOperators] && op in b[classOperators])
      return await b[classOperators][op](a);
    return undefined;
  }

  async function apply_op(op: string, a: any, b: any) {
    function num(x: any) {
      if (typeof x != "number") throwGood(new TypeError(`Expected number but got ${x}`));
      return x;
    }
    function div(x: any) {
      if (num(x) == 0) throwGood(new Error("Divide by zero"));
      return x;
    }

    const res = await overloadOp(op, a, b);
    if (res) return res;
    switch (op) {
      case "+":
        return num(a) + num(b);
      case "-":
        return num(a) - num(b);
      case "*":
        return num(a) * num(b);
      case "/":
        return num(a) / num(b);
      case "%":
        return num(a) % num(b);
      case "&&":
        return a !== false && b;
      case "||":
        return a !== false ? a : b;
      case "<":
        return num(a) < num(b);
      case ">":
        return num(a) > num(b);
      case "<=":
        return num(a) <= num(b);
      case ">=":
        return num(a) >= num(b);
      case "==":
        return a === b;
      case "!=":
        return a !== b;
    }
    throwGood(new Error(`Can't apply operator ${op}`));
  }

  function isBadArg(arg: any) {
    if (arg == undefined) return true;
    // if (arg === false) return true;
    // if (arg.type == "boolean" && arg.value == false) return true;
    return false;
  }

  async function defineArgument(
    names: Argument[],
    scope: Environment,
    env: Environment,
    i: number,
    args: IArguments,
    path: string
  ) {
    scope.def(
      names[i].name,
      i < args.length && !isBadArg(args[i])
        ? args[i]
        : names[i].default === null
        ? null
        : await mainExp(names[i].default!, env, path)
    );
  }
  function make_function(env: Environment, exp: Statements["function"] | Expressions["functionExpr"], path: string) {
    async function _function() {
      let names = exp.vars;
      let scope = env.extend();
      for (let i = 0; i < names.length; i++) await defineArgument(names, scope, env, i, arguments, path);
      return await main(exp.body, scope, path);
    }
    if (exp.name) env.def(exp.name, _function);

    return _function;
  }

  async function make_class(env: Environment, exp: Statements["class"], path: string) {
    async function _function() {
      // let key = "";
      // if (exp.name) {
      //   key =
      //     exp.name +
      //     "|" +
      //     (
      //       await Array.from(arguments).asyncMap(async (value) => {
      //         if (typeof value == "object") {
      //           if (value && value.__isString__ === true) {
      //             return await value.toString();
      //           }
      //           return JSON.stringify(value);
      //         }
      //         return value;
      //       })
      //     ).join(",");
      //   if (classesBuffer.has(key)) return duplicateObj(classesBuffer.get(key)!);
      // }
      let constructorIndex = ClassUtils.constructorIndex(exp);
      let constructor: ClassBody["func"] | null = null;
      if (constructorIndex != -1) {
        let _constructor = exp.body[constructorIndex];
        if (_constructor.type == "func") constructor = _constructor;
      }
      let names = constructor ? constructor.vars : [];
      let bodyScope = env.extend();
      // for (let i = 0; i < names.length; i++) await defineArgument(names, scope, env, i, arguments);

      // @ts-expect-error
      let instance = <PRGM_Class>new (0, eval(`(class ${exp.name} {})`))();
      // let instance = <PRGM_Class>Object.create(null);
      if (exp.extendsName) {
        bodyScope.def("super", async (...args: any[]) => {
          if (exp.extendsName) {
            instance = Object.assign(instance, await env.get(exp.extendsName)(...args));
            bodyScope.def("this", instance);
          }
        });
      }
      bodyScope.def("this", instance);

      for (let i = 0; i < exp.body.length; i++) {
        const element = exp.body[i];
        switch (element.type) {
          case "prop":
            if (!element.static)
              await mainExp(
                {
                  type: "binary",
                  operator: "=",
                  left: {
                    type: "binary",
                    operator: ".",
                    left: {
                      type: "var",
                      value: "this"
                    },
                    right: {
                      type: "var",
                      value: element.name
                    }
                  },
                  right: element.value
                },
                bodyScope,
                path
              );
            break;
          case "func":
            if (!element.static)
              await mainExp(
                {
                  type: "binary",
                  operator: "=",
                  left: {
                    type: "binary",
                    operator: ".",
                    left: {
                      type: "var",
                      value: "this"
                    },
                    right: {
                      type: "var",
                      value: element.name
                    }
                  },
                  right: {
                    type: "functionExpr",
                    body: element.body,
                    vars: element.vars
                  }
                },
                bodyScope,
                path
              );
            break;
          case "operator":
            instance[classOperators] = instance[classOperators] || {};
            instance[classOperators][element.op] = await main(element.value, bodyScope, path);
            break;
        }
      }

      let constructorScope = bodyScope.extend();

      if (constructor) {
        for (let i = 0; i < names.length; i++) {
          await defineArgument(names, constructorScope, bodyScope, i, arguments, path);
        }

        await main(constructor.body, constructorScope, path);

        // for (let i = 0; i < constructor.body.prog.length; i++) {
        //   const element = constructor.body.prog[i];

        //   console.log("element: ", element);
        //   await main(element, constructorScope);
        // }
      }

      // if (key) classesBuffer.set(key, instance);
      return instance;
    }

    let staticEnv = env.extend();

    staticEnv.def("this", _function);

    for (let i = 0; i < exp.body.length; i++) {
      const element = exp.body[i];
      switch (element.type) {
        case "prop":
          // @ts-ignore
          if (element.static) _function[element.name] = await main(element.value, staticEnv);
          break;
        case "func":
          if (element.static)
            // @ts-ignore
            _function[element.name] = await main(
              {
                type: "function",
                body: element.body,
                vars: element.vars
              },
              staticEnv
            );
          break;
      }
    }
    if (exp.name != undefined) {
      env.def(exp.name, _function);
    }
    return _function;
  }

  await _import(
    {
      type: "import",
      value: {
        type: "str",
        value: "/std/String"
      }
    },
    env,
    "/"
  );
  env.def("exit", (code?: number) => {
    for (const loop of asyncWhileLoops) {
      clearInterval(loop);
    }
    asyncWhileLoops.length = 0;
    onExit(code || 0);
    throw `exited with code ${code || 0}`;
  });

  const asyncWhileLoops: ReturnType<typeof setInterval>[] = [];

  async function call(func: Function, callArgs: ASTExpression[], env: Environment, path: string) {
    if (typeof func != "function") {
      throwGood(new TypeError(`${JSON.stringify(func)} is not a function`));
      return false;
    }
    let args: any[] = [];
    for (const arg of callArgs) {
      args.push(await mainExp(arg, env, path));
    }
    let res = await func.apply(null, args);
    // if (typeof res == "object") {
    //   res = main(res, env, testingFlag);
    // }
    return res;
  }

  async function mainExp(exp: ASTExpression, env: Environment, path: string): Promise<any> {
    return await main(convertToStatement(exp), env, path);
  }

  async function main(statement: ASTStatement, env: Environment, path: string): Promise<any> {
    switch (statement.type) {
      case "statementExpr":
        {
          let exp = statement.expr;
          switch (exp.type) {
            case "unary":
              switch (exp.operator) {
                case "!": {
                  let val = await mainExp(exp.body, env, path);
                  return val === false || val === null ? true : false;
                }
                case "-": {
                  let val = await mainExp(exp.body, env, path);
                  return apply_op("-", 1, val);
                }
              }
              return undefined;
            case "binary":
              switch (exp.operator) {
                case "=":
                  if (exp.left.type != "var" && !(exp.left.type == "binary" && exp.left.operator == ".")) {
                    throwGood(new TypeError(`Cannot assign to ${JSON.stringify(exp.left)}`));
                    return null;
                  }
                  if (exp.left.type == "var") return env.set(exp.left.value, await mainExp(exp.right, env, path));
                  else {
                    // This is for assignment to a property of an object (`target`).
                    let [target, , value] = applyVar(await mainExp(exp.left.left, env, path), exp.left.right);
                    return (target[value] = await mainExp(exp.right, env, path));
                  }
                case "+=":
                case "-=":
                case "/=":
                case "*=":
                  const res = await overloadOp(
                    exp.operator,
                    await mainExp(exp.left, env, path),
                    await mainExp(exp.right, env, path)
                  );
                  if (res !== undefined) return res;
                  return await mainExp(
                    {
                      type: "binary",
                      operator: "=",
                      left: exp.left,
                      right: {
                        type: "binary",
                        operator: exp.operator[0],
                        left: exp.left,
                        right: exp.right
                      }
                    },
                    env,
                    path
                  );
                case ".":
                  return await evalDot(env, exp, path);
                default:
                  return await apply_op(exp.operator, await mainExp(exp.left, env, path), await mainExp(exp.right, env, path));
              }
            case "call":
              let func: Function = await mainExp(exp.func, env, path);
              return await call(func, exp.args, env, path);
            case "object": {
              let res: { [key: string]: any } = {};
              let scope = env.extend();
              scope.def("this", res);
              for (const key in exp.data) {
                if (Object.prototype.hasOwnProperty.call(exp.data, key)) {
                  const element = exp.data[key];
                  res[key] = await mainExp(element, scope, path);
                }
              }
              return res;
            }
            case "functionExpr": {
              return make_function(env, exp, path);
            }

            case "null":
              return null;
            case "var":
              return env.get(exp.value);
            case "str":
              return env.get("String")(exp.value.split(""));
            case "char":
              if (exp.value.length > 1) throwGood(new TypeError("Char can hold up to 1 character"));
            case "bool":
            case "num":
              return exp.value;
          }
        }
        break;

      case "prog": {
        let val: any = false;
        // let exports: Types["export"][] = [];
        for (const _exp of statement.prog) {
          val = await main(_exp, env, path);
          // if (isAST(val) && val.type == "export") {
          //   exports.push(val);
          // }
        }
        // if (exports.length > 0) return [exports, val];
        return val;
      }
      case "if":
        let cond = await mainExp(statement.cond, env, path);
        if (cond !== false) return await main(statement.then, env, path);
        return statement.else ? await main(statement.else, env, path) : false;
      case "do": {
        do {
          await main(statement.body, env, path);
        } while ((await mainExp(statement.cond, env, path)) !== false);
        // const value = { loop: exp, env, i: 0 };
        // doWhileLoops.push(value);
        // await awaitDeletion(doWhileLoops, value);
        return false;
      }
      case "_while": {
        let i = 0;
        const interval = setInterval(async () => {
          const cond = await mainExp(statement.cond, env, path);

          if (cond === false && statement.else && i == 0) {
            await main(statement.else, env, path);
            clearInterval(interval);
          } else if (cond) {
            await main(statement.body, env, path);
            i++;
          } else {
            clearInterval(interval);
          }
          i++;
        }, 1000 / 60);
        asyncWhileLoops.push(interval);
        break;
      }
      case "while": {
        /* if (testingFlag)
        await syncAsyncLoop(
          async () => await main(exp.body, env),
          async () => (await main(exp.cond, env)) != false
        );
      else */
        if (statement.else && (await mainExp(statement.cond, env, path)) === false) {
          await main(statement.else, env, path);
        } else
          while ((await mainExp(statement.cond, env, path)) !== false) {
            await main(statement.body, env, path);
          }

        return false;
      }
      case "function": {
        return make_function(env, statement, path);
      }

      case "class":
        return make_class(env, statement, path);

      case "import":
        await _import(statement, env, path);
        return null;
      // case "export":
      //   await main(exp.value, env, testingFlag);
      //   return exp;

      default:
        // @ts-ignore
        throwGood(new Error(`I don't know how to main an expression of type "${statement.type}"`), pid);
    }
  }
  return main(exp, env, _path);
}
