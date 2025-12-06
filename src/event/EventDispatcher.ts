type Listener<E> = (e: E) => void;

type CommonListener = (...rest: never) => unknown;

class EventDispatcher<T = Record<string, unknown>, AK extends keyof T = keyof T> {
  private _listeners: Map<AK, CommonListener[]> = new Map();
  private _oneTimeListeners: Map<AK, CommonListener[]> = new Map();

  on<K extends AK>(type: K, listener: Listener<T[K]>) {
    const arr = this._listeners.get(type);
    if (!arr) {
      this._listeners.set(type, [listener]);
    } else {
      const index = arr.indexOf(listener);
      if (index === -1) {
        arr.push(listener);
      }
    }
    return this;
  }

  once<K extends AK>(type: K, listener?: Listener<T[K]>) {
    if (!listener) {
      return new Promise((resolve) => {
        this.once(type, resolve);
      });
    }
    const arr = this._oneTimeListeners.get(type);
    if (!arr) {
      this._oneTimeListeners.set(type, [listener]);
    } else {
      const index = arr.indexOf(listener);
      if (index === -1) {
        arr.push(listener);
      }
    }
    return this;
  }

  fire<K extends AK>(type: K, data: T[K]) {
    const arr = this._listeners.get(type) as Listener<T[K]>[];
    if (arr) {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i](data);
      }
    }
    const oneTimeArr = this._oneTimeListeners.get(type) as Listener<T[K]>[];
    if (oneTimeArr) {
      for (let i = 0; i < oneTimeArr.length; i += 1) {
        oneTimeArr[i](data);
      }
    }
    this._oneTimeListeners.delete(type);

    return this;
  }

  off<K extends AK>(type: K, listener: Listener<T[K]>) {
    const arr = this._listeners.get(type);
    if (arr) {
      for (let i = arr.length - 1; i >= 0; i -= 1) {
        if (arr[i] === listener) {
          arr.splice(i, 1);
          break;
        }
      }
      if (arr.length === 0) {
        this._listeners.delete(type);
      }
    }
    const oneTimeArr = this._oneTimeListeners.get(type);
    if (oneTimeArr) {
      for (let i = oneTimeArr.length - 1; i >= 0; i -= 1) {
        if (oneTimeArr[i] === listener) {
          oneTimeArr.splice(i, 1);
          break;
        }
      }
      if (oneTimeArr.length === 0) {
        this._oneTimeListeners.delete(type);
      }
    }
    return this;
  }

  getListeners<K extends AK>(type: K) {
    return this._listeners.get(type);
  }

  getOneTimeListeners<K extends AK>(type: K) {
    return this._oneTimeListeners.get(type);
  }

  clearRegister() {
    this._listeners.clear();
    this._oneTimeListeners.clear();
    return this;
  }
}

export { EventDispatcher };
