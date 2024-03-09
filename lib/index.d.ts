import { Environment } from "./eval/Environment";
import { PRGM_String } from "./eval/evaluate";
export * from "./DefaultEnv";
export * from "./InputStream";
export * from "./TokenStream";
export * from "./eval/Environment";
export * from "./eval/evaluate";
export * from "./parse";
export declare function toPRGM_String(str: string, env: Environment): Promise<PRGM_String>;
