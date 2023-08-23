import { Environment } from "./eval/Environment";
import { AST } from "./parse";
export declare function defaultEnv(): Environment;
export declare function evalNewEnv(prgm: string | AST, path?: string, pid?: number, beforeExecution?: (env: Environment) => void, onExit?: (code: number) => void): Promise<any>;
