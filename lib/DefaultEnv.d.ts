import { Environment } from "./eval/Environment";
import { AST } from "./parse";
export declare function defaultEnv(): Environment;
export declare function evalNewEnv(prgm: string | AST, pid: number, path: string, beforeExecution?: (env: Environment) => void, onExit?: (code: number) => void): Promise<any>;
