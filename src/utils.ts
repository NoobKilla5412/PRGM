declare global {
  interface Array<T> {
    asyncMap<R>(cb: (value: T, index: number, array: T[]) => Promise<R>): Promise<R[]>;
  }
}

Array.prototype.asyncMap = async function asyncMap<R>(cb: (value: any, index: number, array: any[]) => Promise<R>) {
  let arr: R[] = [];

  for (let index = 0; index < this.length; index++) {
    const value = this[index];
    arr.push(await cb(value, index, this));
  }

  return arr;
};

export function useUtils() {}

export function clone<T>(obj: T): T {
  if (typeof obj == "object" && obj) {
    if ("clone" in obj && typeof obj.clone == "function") {
      return obj.clone();
    }

    let res = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const element = obj[key];
        res[key] = clone(element);
      }
    }
    return res;
  } else {
    return obj;
  }
}
