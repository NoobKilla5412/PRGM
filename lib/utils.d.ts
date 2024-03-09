declare global {
    interface Array<T> {
        asyncMap<R>(cb: (value: T, index: number, array: T[]) => Promise<R>): Promise<R[]>;
    }
}
export declare function useUtils(): void;
export declare function clone<T>(obj: T): T;
