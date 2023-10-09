// import { readFileSync } from "fs";
// import { homedir } from "os";
// import { join } from "path";
// import { defaultEnv } from "../DefaultEnv";
// import { ASTStatement, Argument, Statements, parse } from "../parse";
// import { useUtils } from "../utils";
// import { Environment } from "./Environment";

// useUtils();

// let buffer = new Map<ASTStatement, string>();

// const ops: { [op: string]: string } = {
//   "+=": "plusEquals",
//   "+": "plus",
//   "==": "equalsEquals",
//   "!=": "notEquals"
// };

// export async function compile(exp: Statements["prog"], _path: string) {
//   let env = defaultEnv();

//   let i = 0;

//   let names = new Map<string, string>([
//     ["JSON", "$JSON"],
//     ["Math", "$Math"]
//   ]);

//   const excludeNames: string[] = ["constructor", "this", "super"];

//   function makeVar(name: string) {
//     if (excludeNames.includes(name)) return name;
//     if (names.has(name)) return names.get(name)!;
//     if (!name) return "";
//     let res = name.replace(/[?!-+/*%<>=]/g, "");
//     if (res == "__operator") {
//       return `__operator_${ops[name.slice(10)]}`;
//     }
//     let _res = `${res}_${i++}`;
//     if (res == name) _res = res;
//     names.set(name, _res);
//     return _res;
//   }

//   async function compileFunctionVars(vars: Argument[]) {
//     return (
//       await vars.asyncMap(async (v) => makeVar(v.name) + (v.default ? " = " + (await main(v.default, _path, env)) : ""))
//     ).join(", ");
//   }
//   if (buffer.has(exp)) return buffer.get(exp)!;

//   let _res_ = "";
//   const excludeVars = ["[object JSON]", "[object Math]"];
//   for (const key in env.vars) {
//     const element = env.vars[key];
//     if (!excludeVars.includes(Object.prototype.toString.call(element))) {
//       _res_ += `const ${makeVar(key)} = ${element};\n`;
//     }
//   }
//   _res_ += `const ${makeVar("JSON")} = JSON;
// const ${makeVar("Math")} = Math;
// const ${makeVar("println")} = console.log;`;
//   let classes: string[] = [];

//   _res_ += await main(
//     {
//       type: "import",
//       value: {
//         type: "str",
//         value: "/std/String"
//       }
//     },
//     _path,
//     env
//   );

//   function buildPath(file: string, path: string) {
//     return file.startsWith("/") ? file + ".prgm" : `${path}/${file}.prgm`;
//   }

//   async function _import(exp: Statements["import"], env: Environment, path: string) {
//     let code = "";
//     while (path.startsWith("//")) path = path.slice(1);
//     let builtPath = buildPath(exp.value.value, path);
//     // console.log(builtPath);
//     let basePath = "";
//     if (process.platform == "win32") {
//       basePath = join(homedir(), "AppData\\Roaming\\npm\\node_modules\\prgm-lang");
//     }
//     // console.log(process.execPath);
//     // console.log(path.join(basePath, "standardLibrary", builtPath.split("/").splice(2).join("/")));
//     if (builtPath.startsWith("/std/")) {
//       code = readFileSync(join(basePath, "standardLibrary", builtPath.split("/").splice(2).join("/"))).toString();
//     } else code = readFileSync(builtPath).toString();
//     const ast = parse(code);
//     let newPath = exp.value.value.split("/").slice(0, -1).join("/");
//     if (!newPath.startsWith("/")) newPath = "/" + newPath;
//     // console.log(ast);
//     /* const [exports] = <[Types["export"][]]> */ return (await main(ast, path + newPath, env)) + ";";
//     // for (const exportedItem of exports) {
//     //   const name = getName(exportedItem.value);
//     //   if (name) {
//     //     env.def(name, await evaluate(exportedItem.value, env, testingFlag));
//     //   }
//     // }
//   }

//   function convertToPROG(exp: ASTStatement): Statements["prog"] {
//     if (exp.type != "prog") {
//       exp = {
//         type: "prog",
//         prog: [exp]
//       };
//     }
//     return exp;
//   }

//   async function main(exp: ASTStatement, path: string, env: Environment, topLevel = false): Promise<string> {
//     if (buffer.has(exp)) return buffer.get(exp)!;
//     let _res = "";
//     switch (exp.type) {
//       case "object":
//         break;
//       case "function":
//         break;
//       case "unary":
//         break;
//       case "binary":
//         _res += `(${await main(exp.left, path, env)} ${exp.operator} ${await main(exp.right, path, env)})`;
//         break;
//       case "call":
//         _res += `(${await main(exp.func, path, env)})(${await exp.args.asyncMap(async (v) => await main(v, path, env))})`;
//         break;
//       case "prog":
//         _res += `{${(await exp.prog.asyncMap(async (v) => await main(v, path, env))).join(";\n")}}`;
//         break;
//       case "if":
//         break;
//       case "do":
//         break;
//       case "_while":
//         break;
//       case "while":
//         break;
//       case "class":
//         break;
//       case "import":
//         break;
//       case "export":
//         break;
//       case "null":
//         break;
//       case "var":
//         _res += `${makeVar(exp.value)}`;
//         break;
//       case "bool":
//       case "num":
//       case "str":
//         _res += JSON.stringify(exp.value);
//         break;
//       case "char":
//         break;
//     }

//     //     switch (exp.type) {
//     //       case "object":
//     //         let res: { [key: string]: any } = {};
//     //         for (const key in exp.data) {
//     //           if (Object.prototype.hasOwnProperty.call(exp.data, key)) {
//     //             const element = exp.data[key];
//     //             res[key] = await main(element, path, env);
//     //           }
//     //         }
//     //         _res = JSON.stringify(res);
//     //         break;
//     //       case "function":
//     //         exp.body = convertToPROG(exp.body);
//     //         _res = `function ${makeVar(exp.name || "")}(${await compileFunctionVars(exp.vars)}) {${(
//     //           await exp.body.prog.asyncMap(
//     //             async (v, i, array) => (i == array.length - 1 ? "return " : "") + (await main(v, path, env))
//     //           )
//     //         ).join(";\n")}}`;
//     //         break;
//     //       case "unary":
//     //         _res = `${exp.operator}(${await main(exp.body, path, env)})`;
//     //         break;
//     //       case "binary":
//     //         let hasSpace = exp.operator != "." ? " " : "";
//     //         _res = `${await main(exp.left, path, env)}${hasSpace}${exp.operator}${hasSpace}${await main(exp.right, path, env)}`;
//     //         break;
//     //       case "call":
//     //         let func = await main(exp.func, path, env);

//     //         return `${classes.includes(func) ? "new " : ""}${func}(${(
//     //           await exp.args.asyncMap(async (v) => await main(v, path, env))
//     //         ).join(", ")})`;
//     //       case "prog":
//     //         _res = `(${await exp.prog.asyncMap(
//     //           async (v, i, array) => (await main(v, path, env)) + (v.type != "import" || i == array.length - 1 ? "" : ",")
//     //         )})${topLevel ? ";" : ""}`;
//     //         break;
//     //       case "if":
//     //         _res = `(${await main(exp.cond, path, env)}) ? ${await main(convertToPROG(exp.then), path, env)} : ${
//     //           exp.else ? `${await main(convertToPROG(exp.else), path, env)}` : "null"
//     //         }`;
//     //         break;
//     //       case "do":
//     //         _res = `(() => {do {${await main(convertToPROG(exp.body), path, env)}} while (${await main(exp.cond, path, env)})})()`;
//     //         break;
//     //       case "_while":
//     //         let hasElse = exp.else != undefined;
//     //         _res = `(async () => {
//     //         return new Promise((resolve) => {
//     //           let first = ${await main(exp.cond, path, env)};
//     //           if (!first && ${hasElse}) {
//     //             ${exp.else ? await main(exp.else, path, env) : ""}
//     //           } else {
//     //             const interval = setInterval(() => {
//     //               if (${await main(exp.cond, path, env)}) {
//     //                 ${await main(exp.body, path, env)};
//     //               } else {
//     //                 clearInterval(interval);
//     //               }
//     //             });
//     //           }
//     //         });
//     //       })()`;
//     //         break;
//     //       case "while":
//     //         _res = `(() => {
//     //   let first = ${await main(exp.cond, path, env)};
//     //   if (!first) {
//     //     ${await main(exp.body, path, env)};
//     //   } else
//     //     while (${await main(exp.cond, path, env)}) {
//     //       ${await main(exp.body, path, env)};
//     //     }
//     // })()`;
//     //         break;
//     //       case "class":
//     //         exp.name && classes.push(makeVar(exp.name));
//     //         _res = `class ${exp.name ? makeVar(exp.name) : ""} {
//     //   ${(
//     //     await exp.body.asyncMap(async (v) => {
//     //       switch (v.type) {
//     //         case "prop":
//     //           return `${makeVar(v.name)} = ${await main(v.value, path, env)};`;
//     //         case "func":
//     //           if (v.name == "constructor") {
//     //             return `${makeVar(v.name)}(${await compileFunctionVars(v.vars)}) {${await main(v.body, path, env)}}`;
//     //           }
//     //           return `${makeVar(v.name)}(${await compileFunctionVars(v.vars)}) {return ${await main(v.body, path, env)}}`;
//     //         case "operator":
//     //           return `__operator_${ops[v.op]}(${await compileFunctionVars(v.value.vars)}) {return ${await main(
//     //             v.value.body,
//     //             path,
//     //             env
//     //           )}}`;
//     //       }
//     //     })
//     //   ).join("\n  ")}
//     // }`;
//     //         break;
//     //       case "import":
//     //         _res = (await _import(exp, env, path)) + "\n";
//     //         break;
//     //       case "null":
//     //         _res = `null`;
//     //         break;
//     //       case "var":
//     //         _res = makeVar(exp.value);
//     //         break;
//     //       case "bool":
//     //         _res = `${exp.value}`;
//     //         break;
//     //       case "num":
//     //         _res = exp.value.toString();
//     //         break;
//     //       case "str":
//     //         _res = `"${exp.value.replace(/"/g, '\\"')}"`;
//     //         break;
//     //       case "char":
//     //         _res = `(new Char('${exp.value.replace(/'/g, "\\'")}'))`;
//     //         break;
//     //     }
//     buffer.set(exp, _res);
//     return _res;
//   }
//   _res_ += await main(exp, _path, env, true);
//   buffer.set(exp, _res_);
//   return _res_;
// }
