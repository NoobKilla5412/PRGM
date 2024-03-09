import { InputStream } from "./InputStream";
export interface TokenTypes {
    num: {
        type: "num";
        value: number;
    };
    str: {
        type: "str";
        value: string;
    };
    kw: {
        type: "kw";
        value: string;
    };
    var: {
        type: "var";
        value: string;
    };
    punc: {
        type: "punc";
        value: string;
    };
    op: {
        type: "op";
        value: string;
    };
    char: {
        type: "char";
        value: string;
    };
}
export type Token = TokenTypes[keyof TokenTypes];
export declare class TokenStream {
    private current;
    private keywords;
    registerKeyword(keyword: string): void;
    private input;
    constructor(input: InputStream);
    private is_keyword;
    private is_digit;
    private is_id_start;
    private is_id;
    private is_op_char;
    private is_punc;
    private is_whitespace;
    private read_while;
    private read_number;
    private read_ident;
    private readonly escapeChars;
    private read_escaped;
    private read_string;
    private read_char;
    private skip_comment;
    private read_next;
    peek(offset?: number): Token | undefined;
    next(): Token | undefined;
    eof(): boolean;
    croak(msg: string): Error;
}
