import { Token } from "./TokenStream";
export interface Argument {
    name: string;
    default: ASTExpression | null;
}
export interface ClassBody {
    prop: {
        type: "prop";
        static: boolean;
        name: string;
        value: ASTExpression;
    };
    func: {
        type: "func";
        static: boolean;
        name: string;
        vars: Argument[];
        body: Statements["prog"];
    };
    operator: {
        type: "operator";
        op: string;
        value: Statements["function"];
    };
}
export declare namespace ClassUtils {
    function constructorIndex(obj: Statements["class"]): number;
}
export interface Expressions {
    unary: {
        type: "unary";
        operator: string;
        body: ASTExpression;
    };
    binary: {
        type: "binary";
        operator: string;
        left: ASTExpression;
        right: ASTExpression;
    };
    arrayAccess: {
        type: "arrayAccess";
        val: ASTExpression;
        getter: ASTExpression;
    };
    call: {
        type: "call";
        func: ASTExpression;
        args: ASTExpression[];
    };
    functionExpr: {
        type: "functionExpr";
        name?: string;
        vars: Argument[];
        body: ASTStatement;
    };
    classExpr: {
        type: "classExpr";
        name?: string;
        extendsName: string | null;
        body: ClassBody[keyof ClassBody][];
    };
    object: {
        type: "object";
        data: {
            [key: string]: ASTExpression;
        };
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
export interface Statements {
    statementExpr: {
        type: "statementExpr";
        expr: Expressions[keyof Expressions];
    };
    prog: {
        type: "prog";
        prog: ASTStatement[];
    };
    if: {
        type: "if";
        cond: ASTExpression;
        then: ASTStatement;
        else?: ASTStatement;
    };
    do: {
        type: "do";
        cond: ASTExpression;
        body: ASTStatement;
    };
    _while: {
        type: "_while";
        cond: ASTExpression;
        body: ASTStatement;
        else?: ASTStatement;
    };
    while: {
        type: "while";
        cond: ASTExpression;
        body: ASTStatement;
        else?: ASTStatement;
    };
    function: {
        type: "function";
        name: string;
        vars: Argument[];
        body: ASTStatement;
    };
    class: {
        type: "class";
        name: string;
        extendsName: string | null;
        body: ClassBody[keyof ClassBody][];
    };
    import: {
        type: "import";
        value: Expressions["str"];
    };
}
export declare function convertToStatement(expr: ASTExpression): Statements["statementExpr"];
export type ASTStatement = Statements[keyof Statements];
export type ASTExpression = Expressions[keyof Expressions];
export declare function parse(str: string, onError?: (err: Error) => void, testingFlag?: boolean): Statements["prog"];
