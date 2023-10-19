/* eslint-disable */
export type TODO = any;

export class Environment {
  public vars: { [key: string]: TODO };
  public parent: Environment | undefined;

  public constructor(parent?: Environment) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
  }

  // public static testEnv() {
  //   let res = new Environment();
  //   res.def("Window", (title: string, width: number, height: number, x?: number, y?: number) => {});
  //   res.def("println", (txt: string) => {});
  //   res.def("key", (listener: (e: { key: string }) => void, window: Window) => {});
  //   res.def("keyUp", (listener: (e: { key: string }) => void, window: Window) => {});
  //   return res;
  // }

  public extend() {
    return new Environment(this);
  }

  // public unExtend(env: Environment) {

  // }

  public lookup(name: string) {
    let scope: Environment | undefined = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
        return scope;
      }
      scope = scope.parent;
    }
    return undefined;
  }

  public get(name: string) {
    if (name in this.vars) return this.vars[name];
    throw new ReferenceError(`Undefined variable "${name}"`);
  }
  public getWithNullInsteadOfError(name: string) {
    if (name in this.vars) return this.vars[name];
    return null;
  }

  public set(name: string, value: TODO) {
    let scope = this.lookup(name);
    // let's not allow defining globals from a nested environment
    // if (!scope && this.parent) throw new ReferenceError(`Undefined variable "${name}"`);
    return ((scope || this).vars[name] = value);
  }

  public def(name: string, value: TODO) {
    return (this.vars[name] = value);
  }
}
