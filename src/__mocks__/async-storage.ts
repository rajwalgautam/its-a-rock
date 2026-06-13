const store: Record<string, string> = {};

const AsyncStorage = {
  getItem: (key: string) => Promise.resolve(store[key] ?? null),
  setItem: (key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    delete store[key];
    return Promise.resolve();
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
    return Promise.resolve();
  },
};

export default AsyncStorage;
