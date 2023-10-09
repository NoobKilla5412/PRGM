import { Environment } from "./eval/Environment";
import { ASTStatement } from "./parse";
export declare function defaultEnv(): Environment;
export declare function evalNewEnv(prgm: string | ASTStatement, path?: string, pid?: number, beforeExecution?: (env: Environment) => void, onExit?: (code: number) => void): Promise<any>;
