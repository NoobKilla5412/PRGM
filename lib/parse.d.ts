import { TokenTypes } from "./TokenStream";
export interface Argument {
    name: string;
    default: Expression | null;
}
export interface ClassBody {
    prop: {
        type: "prop";
        static: boolean;
        name: string;
        value: Expression;
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
        body: Expression;
    };
    binary: {
        type: "binary";
        operator: string;
        left: Expression;
        right: Expression;
    };
    arrayAccess: {
        type: "arrayAccess";
        val: Expression;
        getter: Expression;
    };
    call: {
        type: "call";
        func: Expression;
        args: Expression[];
    };
    functionExpr: {
        type: "functionExpr";
        name?: string;
        vars: Argument[];
        body: Statement;
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
            [key: string]: Expression;
        };
    };
    null: {
        type: "null";
    };
    var: TokenTypes["var"];
    bool: {
        type: "bool";
        value: boolean;
    };
    num: TokenTypes["num"];
    str: TokenTypes["str"];
    char: TokenTypes["char"];
    customSyntaxRtn: CustomSyntaxRtn & {
        vars: CustomSyntaxVars;
    };
}
export interface Statements {
    statementExpr: {
        type: "statementExpr";
        expr: Expressions[keyof Expressions];
    };
    prog: {
        type: "prog";
        prog: Statement[];
    };
    if: {
        type: "if";
        cond: Expression;
        then: Statement;
        else?: Statement;
    };
    do: {
        type: "do";
        cond: Expression;
        body: Statement;
    };
    _while: {
        type: "_while";
        cond: Expression;
        body: Statement;
        else?: Statement;
    };
    while: {
        type: "while";
        cond: Expression;
        body: Statement;
        else?: Statement;
    };
    for: {
        type: "for";
        init: Expression;
        check: Expression;
        inc: Expression;
        body: Statement;
    };
    function: {
        type: "function";
        name: string;
        vars: Argument[];
        body: Statement;
    };
    class: {
        type: "class";
        name: string;
        extendsName: string | null;
        body: ClassBody[keyof ClassBody][];
    };
    record: {
        type: "record";
        name: string;
        vars: Argument[];
        body: ClassBody[keyof ClassBody][];
    };
    import: {
        type: "import";
        value: Expressions["str"];
    };
    export: {
        type: "export";
        value: Statement;
    };
    customSyntaxRtn: CustomSyntaxRtn & {
        vars: CustomSyntaxVars;
    };
}
export declare function convertToStatement(expr: Expression): Statements["statementExpr"];
export type Statement = Statements[keyof Statements];
export type Expression = Expressions[keyof Expressions];
type CustomSyntaxRtn = {
    type: "customSyntaxRtn";
    value: Statements["prog"];
};
type CustomSyntaxVars = {
    [name: string]: Statement;
};
export declare function parse(str: string, onError?: (err: Error) => void, testingFlag?: boolean): Statements["prog"];
export {};
