export declare class InputStream {
    private pos;
    private line;
    private col;
    private input;
    constructor(input: string);
    next(): string;
    peek(): string;
    eof(): boolean;
    croak(msg: string): never;
}
