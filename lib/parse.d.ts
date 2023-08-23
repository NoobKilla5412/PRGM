import { Token } from "./TokenStream";
export interface Argument {
    name: string;
    default: AST | null;
}
export interface ClassBody {
    prop: {
        type: "prop";
        static: boolean;
        name: string;
        value: AST;
    };
    func: {
        type: "func";
        static: boolean;
        name: string;
        vars: Argument[];
        body: Types["prog"];
    };
    operator: {
        type: "operator";
        op: string;
        value: Types["function"];
    };
}
export declare namespace ClassUtils {
    function constructorIndex(obj: Types["class"]): number;
}
export interface Types {
    unary: {
        type: "unary";
        operator: string;
        body: AST;
    };
    binary: {
        type: "binary";
        operator: string;
        left: AST;
        right: AST;
    };
    call: {
        type: "call";
        func: AST;
        args: AST[];
    };
    prog: {
        type: "prog";
        prog: AST[];
    };
    if: {
        type: "if";
        cond: AST;
        then: AST;
        else?: AST;
    };
    do: {
        type: "do";
        cond: AST;
        body: AST;
    };
    _while: {
        type: "_while";
        cond: AST;
        body: AST;
        else?: AST;
    };
    while: {
        type: "while";
        cond: AST;
        body: AST;
        else?: AST;
    };
    function: {
        type: "function";
        name?: string;
        vars: Argument[];
        body: AST;
    };
    object: {
        type: "object";
        data: {
            [key: string]: AST;
        };
    };
    class: {
        type: "class";
        name?: string;
        extendsName: string | null;
        body: ClassBody[keyof ClassBody][];
    };
    import: {
        type: "import";
        value: Types["str"];
    };
    export: {
        type: "export";
        value: AST;
    };
    null: {
        type: "null";
    };
    var: Token<"var">;
    bool: {
        type: "bool";
        value: boolean;
    };
    num: Token<"num">;
    str: Token<"str">;
    char: Token<"char">;
}
export type AST = Types[keyof Types];
export declare function parse(str: string, testingFlag?: boolean): Types["prog"];
