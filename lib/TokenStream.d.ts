import { InputStream } from "./InputStream";
export interface TokenTypes {
    num: number;
    str: string;
    kw: string;
    var: string;
    punc: string;
    op: string;
    char: string;
}
export type Token<T extends keyof TokenTypes> = {
    type: T;
    value: TokenTypes[T];
};
export declare namespace TokenTypeChecks {
    function check<T extends keyof TokenTypes>(type: T, tok: Token<keyof TokenTypes> | undefined): tok is Token<T>;
}
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
    peek(offset?: number): Token<keyof TokenTypes> | undefined;
    next(): Token<keyof TokenTypes> | undefined;
    eof(): boolean;
    croak(msg: string): Error;
}
