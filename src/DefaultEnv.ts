import { Environment } from "./eval/Environment";
import { evaluate } from "./eval/evaluate";
import { AST, parse } from "./parse";

export function defaultEnv() {
  let res = new Environment();
  // This is where we implement primitive variables.
  res.def("__typeof", (val: any) => typeof val);
  res.def("__array", (...args: any[]) => new Array(...args));
  res.def("__in", (key: string, value: any) => Object.hasOwn(value, key));
  res.def("JSON", JSON);
  res.def("Math", Math);
  res.def("now", () => {
    return performance.now();
  });

  return res;
}

async function println(...data: any[]) {
  let res = [];

  for (const v of data) {
    res.push(typeof v == "object" && v && v.__isString__ === true ? await v.toString() : v);
  }

  console.log(...res);
}

export function evalNewEnv(
  prgm: string | AST,
  path = "/",
  pid?: number,
  beforeExecution?: (env: Environment) => void,
  onExit = (code: number) => {}
) {
  let globalEnv = defaultEnv();
  let prog = typeof prgm == "string" ? parse(prgm) : prgm;
  if (beforeExecution) beforeExecution(globalEnv);
  console.log(prog);

  if (pid == undefined) {
    globalEnv.def("println", println);
  }
  return evaluate(prog, globalEnv, pid ?? 0, path, onExit);
}
