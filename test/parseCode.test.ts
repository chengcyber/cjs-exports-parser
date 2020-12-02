import fs from 'fs-extra';
import { resolveFromFixtures } from './utils';
import { parseCode } from '../src/parseCode';

describe('parseCode', () => {
  it('should work with module.exports', async (done) => {
    const inputPath = resolveFromFixtures('module-exports.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with exports', async (done) => {
    const inputPath = resolveFromFixtures('exports.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with transpiler __exportStar', async (done) => {
    const inputPath = resolveFromFixtures('transpiler/exportStar.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['__esModule']);
    expect(reexports).toEqual(['./foo']);
    done();
  });

  it('should work with transpiler babel', async (done) => {
    const inputPath = resolveFromFixtures('transpiler/babel.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['__esModule']);
    expect(reexports).toEqual(['./foo']);
    done();
  });

  it('should work with UMD', async (done) => {
    const inputPath = resolveFromFixtures('umd/simple.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['umd']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with minified UMD', async (done) => {
    const inputPath = resolveFromFixtures('umd/min.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['umd', 'min']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with readme main', async (done) => {
    const inputPath = resolveFromFixtures('readme/main.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'd', 'e', '__esModule']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with export as function param', async (done) => {
    const inputPath = resolveFromFixtures('function/exports-in-param.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with export as function param and use another formal variable name', async (done) => {
    const inputPath = resolveFromFixtures('function/exports-renamed-param.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with Object.defineProperty when enumerable in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/enumerable.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with Object.defineProperty when value in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/value.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with Object.defineProperty when getter in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/getter.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with Object.defineProperty when getter override', async (done) => {
    const inputPath = resolveFromFixtures(
      'objectDefineProperty/getter-override.js'
    );
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual([]);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with export object with spread', async (done) => {
    const inputPath = resolveFromFixtures('export-object/spread.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with export object with require', async (done) => {
    const inputPath = resolveFromFixtures('export-object/require.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual(['a', 'b', 'c', 'd']);
    expect(reexports).toEqual([]);
    done();
  });

  it('should work with reexport require override', async (done) => {
    const inputPath = resolveFromFixtures('reexport/override.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual([]);
    expect(reexports).toEqual(['./foo']);
    done();
  });

  it('should work with reexport require override object', async (done) => {
    const inputPath = resolveFromFixtures('reexport/override-object.js');
    const code = fs.readFileSync(inputPath).toString();
    const { exports, reexports } = await parseCode(code);
    expect(exports).toEqual([]);
    expect(reexports).toEqual(['./foo', './bar']);
    done();
  });
});
