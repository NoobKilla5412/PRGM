import { Statement } from "../parse";
import { Environment } from "./Environment";
export declare class PRGM_String {
    toString(): Promise<string>;
    static fromString(str: string, env: Environment): Promise<any>;
}
export declare function duplicateObj<T>(obj: T): T;
export declare const classOperators: unique symbol;
export declare function evaluate(exp: Statement, exportEnv: Environment, pid: number, _path: string, onExit?: (code: number) => void, onError?: (err: Error) => void, useExports?: boolean): Promise<any>;
