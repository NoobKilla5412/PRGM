import { Environment } from "./eval/Environment";
import { PRGM_String, evaluate } from "./eval/evaluate";
import { Statement, parse } from "./parse";

export function defaultEnv() {
  let env = new Environment();
  // This is where we implement primitive variables.
  env.def("__typeof", (val: any) => typeof val);
  env.def("__array", (...args: any[]) => new Array(...args));
  env.def("__in", (key: string, value: any) => Object.hasOwn(value, key));
  env.def("JSON", JSON);
  env.def("Math", Math);
  env.def("now", () => {
    return performance.now();
  });
  env.def("println", println);
  env.def("sleep", async (delay?: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, delay));
  });
  env.def("input", async (_message?: PRGM_String) => {
    if (typeof process != "undefined") throw new Error("Input is not supported in the console");
    let message = await _message?.toString();
    return prompt(message);
  });
  env.def("fetch", async (_file: PRGM_String) => {
    let file = await _file?.toString();
    if (typeof process != "undefined") return (await import("fs")).readFileSync(file).toString();
    else return await (await fetch(file)).text();
  });

  return env;
}

async function println(...data: any[]) {
  let res: string[] = [];

  for (const v of data) {
    res.push(typeof v == "object" && v && v.__isString__ === true ? await v.toString() : v);
  }

  console.log(...res);
}

export function evalNewEnv(prgm: string | Statement, path = "/", pid?: number, beforeExecution?: (env: Environment) => void, onExit = (code: number) => {}) {
  let globalEnv = defaultEnv();
  let prog = typeof prgm == "string" ? parse(prgm) : prgm;
  if (pid == undefined) {
    globalEnv.def("println", println);
  }
  if (beforeExecution) beforeExecution(globalEnv);
  // console.log(prog);

  return evaluate(prog, globalEnv, pid ?? 0, path, onExit);
}
