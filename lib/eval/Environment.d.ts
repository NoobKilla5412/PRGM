export type TODO = any;
export declare class Environment {
    vars: {
        [key: string]: TODO;
    };
    parent: Environment | undefined;
    constructor(parent?: Environment);
    extend(): Environment;
    lookup(name: string): Environment | undefined;
    get(name: string): any;
    getWithNullInsteadOfError(name: string): any;
    set(name: string, value: TODO): any;
    def(name: string, value: TODO): any;
}
