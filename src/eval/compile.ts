// import { defaultEnv } from "../DefaultEnv";
// import { AST, Argument, Types, parse } from "../parse";
// import { useUtils } from "../utils";

// useUtils();

// let buffer = new Map<AST, string>();

// const ops: { [op: string]: string } = {
//   "+=": "plusEquals",
//   "+": "plus",
//   "==": "equalsEquals",
//   "!=": "notEquals"
// };

// export async function compile(exp: Types["prog"]) {
//   let env = defaultEnv();

//   let i = 0;

//   let names = new Map<string, string>();

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
//     names.set(name, _res);
//     return _res;
//   }
//   async function compileFunctionVars(vars: Argument[]) {
//     return (await vars.asyncMap(async (v) => makeVar(v.name) + (v.default ? " = " + (await main(v.default)) : ""))).join(", ");
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

//   _res_ += await main({
//     type: "import",
//     value: {
//       type: "str",
//       value: "utils/String"
//     }
//   });

//   async function main(exp: AST, topLevel = false): Promise<string> {
//     if (buffer.has(exp)) return buffer.get(exp)!;
//     let _res = "";
//     switch (exp.type) {
//       case "object":
//         let res: { [key: string]: any } = {};
//         for (const key in exp.data) {
//           if (Object.prototype.hasOwnProperty.call(exp.data, key)) {
//             const element = exp.data[key];
//             res[key] = await main(element);
//           }
//         }
//         _res = JSON.stringify(res);
//         break;
//       case "function":
//         _res = `function ${makeVar(exp.name || "")}(${await compileFunctionVars(exp.vars)}) ${await main(exp.body)}`;
//         break;
//       case "unary":
//         _res = `${exp.operator}(${await main(exp.body)})`;
//         break;
//       case "binary":
//         let hasSpace = exp.operator != "." ? " " : "";
//         _res = `${await main(exp.left)}${hasSpace}${exp.operator}${hasSpace}${await main(exp.right)}`;
//         break;
//       case "call":
//         let func = await main(exp.func);

//         return `${classes.includes(func) ? "new " : ""}${func}(${(await exp.args.asyncMap(async (v) => await main(v))).join(
//           ", "
//         )})`;
//       case "prog":
//         _res = `${topLevel ? "" : "{"}
// ${topLevel ? "" : "  "}${(await exp.prog.asyncMap(async (v) => main(v))).join(";\n" + (topLevel ? "" : "  "))}
// ${topLevel ? "" : "}"}`;
//         break;
//       case "if":
//         _res = `if (${await main(exp.cond)}) ${await main(exp.then)}${exp.else ? `else ${await main(exp.else)}` : ""}`;
//         break;
//       case "do":
//         _res = `do ${await main(exp.body)} while (${await main(exp.cond)});`;
//         break;
//       case "_while":
//         let hasElse = exp.else != undefined;
//         _res = `(async () => {
//         return new Promise((resolve) => {
//           let first = ${await main(exp.cond)};
//           if (!first && ${hasElse}) {
//             ${exp.else ? await main(exp.else) : ""}
//           } else {
//             const interval = setInterval(() => {
//               if (${await main(exp.cond)}) {
//                 ${await main(exp.body)};
//               } else {
//                 clearInterval(interval);
//               }
//             });
//           }
//         });
//       })()`;
//         break;
//       case "while":
//         _res = `{
//   let first = ${await main(exp.cond)};
//   if (!first) {
//     ${await main(exp.body)};
//   } else
//     while (${await main(exp.cond)}) {
//       ${await main(exp.body)};
//     }
// }`;
//         break;
//       case "class":
//         exp.name && classes.push(makeVar(exp.name));
//         _res = `class ${exp.name ? makeVar(exp.name) : ""} {
//   ${(
//     await exp.body.asyncMap(async (v) => {
//       switch (v.type) {
//         case "prop":
//           return `${makeVar(v.name)} = ${await main(v.value)};`;
//         case "func":
//           return `${makeVar(v.name)}(${await compileFunctionVars(v.vars)}) ${await main(v.body)}`;
//         case "operator":
//           return `__operator_${ops[v.op]}(${await compileFunctionVars(v.value.vars)}) ${await main(v.value.body)}`;
//       }
//     })
//   ).join("\n  ")}
// }`;
//         break;
//       case "import":
//         _res = (await main(parse(await getAppSourceCode(exp.value.value)), true)) + "\n";
//         break;
//       case "null":
//         _res = `null`;
//         break;
//       case "var":
//         _res = makeVar(exp.value);
//         break;
//       case "bool":
//         _res = `${exp.value}`;
//         break;
//       case "num":
//         _res = exp.value.toString();
//         break;
//       case "str":
//         _res = `"${exp.value.replace(/"/g, '\\"')}"`;
//         break;
//       case "char":
//         _res = `(new Char('${exp.value.replace(/'/g, "\\'")}'))`;
//         break;
//     }
//     buffer.set(exp, _res);
//     return _res;
//   }
//   _res_ += await main(exp, true);
//   buffer.set(exp, _res_);
//   return _res_;
// }
