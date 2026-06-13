export const openDatabaseSync = () => ({
  execAsync: () => Promise.resolve(),
  runAsync: () => Promise.resolve({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: () => Promise.resolve([]),
  getFirstAsync: () => Promise.resolve(null),
  withTransactionAsync: (cb: () => Promise<void>) => cb(),
});
