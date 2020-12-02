import { resolveFromFixtures } from './utils';
import { parseFile } from '../src/parseFile';

describe('parseFile', () => {
  it('should work with module.exports', async (done) => {
    const inputPath = resolveFromFixtures('module-exports.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a']);
    done();
  });

  it('should work with exports', async (done) => {
    const inputPath = resolveFromFixtures('exports.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c']);
    done();
  });

  it('should work with __exportStar', async (done) => {
    const inputPath = resolveFromFixtures('transpiler/exportStar.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['__esModule', 'foo', 'bar']);
    done();
  });

  it('should work with UMD', async (done) => {
    const inputPath = resolveFromFixtures('umd/simple.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['umd']);
    done();
  });

  it('should work with minified UMD', async (done) => {
    const inputPath = resolveFromFixtures('umd/min.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['umd', 'min']);
    done();
  });

  it('should work with readme main', async (done) => {
    const inputPath = resolveFromFixtures('readme/main.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'd', 'e', '__esModule']);
    done();
  });

  it('should work with export as function param', async (done) => {
    const inputPath = resolveFromFixtures('function/exports-in-param.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c']);
    done();
  });

  it('should work with export as function param and use another formal variable name', async (done) => {
    const inputPath = resolveFromFixtures('function/exports-renamed-param.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c']);
    done();
  });

  it('should work with Object.defineProperty when enumerable in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/enumerable.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c']);
    done();
  });

  it('should work with Object.defineProperty when value in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/value.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a']);
    done();
  });

  it('should work with Object.defineProperty when getter in descriptor', async (done) => {
    const inputPath = resolveFromFixtures('objectDefineProperty/getter.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c', 'd', 'e']);
    done();
  });

  it('should work with Object.defineProperty when getter override', async (done) => {
    const inputPath = resolveFromFixtures(
      'objectDefineProperty/getter-override.js'
    );
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual([]);
    done();
  });

  it('should work with export object with spread', async (done) => {
    const inputPath = resolveFromFixtures('export-object/spread.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c']);
    done();
  });

  it('should work with export object with require', async (done) => {
    const inputPath = resolveFromFixtures('export-object/require.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['a', 'b', 'c', 'd']);
    done();
  });

  it('should work with reexport require override', async (done) => {
    const inputPath = resolveFromFixtures('reexport/override.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['foo']);
    done();
  });

  it('should work with reexport require override object', async (done) => {
    const inputPath = resolveFromFixtures('reexport/override-object.js');
    const { exports } = await parseFile(inputPath);
    expect(exports).toEqual(['foo', 'bar']);
    done();
  });
});
