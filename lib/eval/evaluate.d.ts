import { AST } from "../parse";
import { Environment } from "./Environment";
export declare class PRGM_String {
    toString(): Promise<string>;
}
export declare function duplicateObj<T>(obj: T): T;
export declare const classOperators: unique symbol;
export declare function evaluate(exp: AST, env: Environment, pid: number, onExit: (code: number) => void, _path: string): Promise<any>;
