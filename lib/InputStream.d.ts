export declare class InputStream {
    private pos;
    private line;
    private col;
    private input;
    private onError;
    constructor(input: string, onError?: (err: Error) => void);
    next(): string;
    peek(): string;
    eof(): boolean;
    croak(msg: string): Error;
}
