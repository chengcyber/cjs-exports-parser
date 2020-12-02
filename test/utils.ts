import path from 'path';
const fixturesPath = path.resolve(__dirname, 'fixtures');

export const resolveFromFixtures = (...args: string[]) =>
  path.resolve(fixturesPath, ...args);
