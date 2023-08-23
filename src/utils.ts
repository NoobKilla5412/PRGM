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
