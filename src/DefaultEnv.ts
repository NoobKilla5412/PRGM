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

export function evalNewEnv(
  prgm: string | AST,
  pid: number,
  path: string,
  beforeExecution?: (env: Environment) => void,
  onExit = (code: number) => {}
) {
  let globalEnv = defaultEnv();
  let prog = typeof prgm == "string" ? parse(prgm) : prgm;
  if (beforeExecution) beforeExecution(globalEnv);
  console.log(prog);
  return evaluate(prog, globalEnv, pid, onExit, path);
}
