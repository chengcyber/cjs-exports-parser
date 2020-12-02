import fs from 'fs-extra';
import nodePath from 'path';
import { validateExportVariableName } from './utils/validateExportVariableName';
import { doParse } from './doParse';

/**
 * fileLoc -> exports var list
 */
const cache = new Map<string, string[]>();

export interface ParseFileResult {
  /**
   * export variable name list
   */
  exports: string[];
}

/**
 * parse export variable names from commonjs or umd spec
 * @param fileLoc the aboluste path for a code file
 */
export const parseFile = async (fileLoc: string): Promise<ParseFileResult> => {
  if (!nodePath.isAbsolute(fileLoc)) {
    throw new Error('fileLoc should be a absolute path');
  }
  const cached = cache.get(fileLoc);
  if (Array.isArray(cached)) {
    return { exports: cached };
  }
  const resultSet = new Set<string>();
  const pendingSet = new Set<string>();
  const visitedSet = new Set<string>();
  pendingSet.add(fileLoc);
  while (pendingSet.size) {
    for (const pendingFileLoc of Array.from(pendingSet)) {
      let code = '';
      try {
        code = (await fs.readFile(pendingFileLoc)).toString();
      } catch (e) {
        throw e;
      }
      const addExport = (name: string) => {
        resultSet.add(name);
      };
      const removeExport = (name: string) => {
        resultSet.delete(name);
      };
      const clearExports = () => {
        resultSet.clear();
      };
      const addReexport = (reexportPath: string) => {
        if (nodePath.isAbsolute(reexportPath)) {
          if (!visitedSet.has(reexportPath)) {
            pendingSet.add(reexportPath);
          }
        } else {
          if (pendingFileLoc) {
            const targetPath = require.resolve(reexportPath, {
              paths: [nodePath.dirname(pendingFileLoc)],
            });
            if (!visitedSet.has(reexportPath)) {
              pendingSet.add(targetPath);
            }
          } else {
            if (!visitedSet.has(reexportPath)) {
              pendingSet.add(reexportPath);
            }
          }
        }
      };
      // const removeReexport = (name: string) => {
      //   resultSet.delete(name);
      // };
      const clearReexports = () => {
        // POTENTIONAL BUG?
        pendingSet.clear();
      };
      const onDone = () => {
        visitedSet.add(pendingFileLoc);
        pendingSet.delete(pendingFileLoc);
      };
      await doParse(
        {
          addExport,
          removeExport,
          clearExports,
          addReexport,
          // removeReexport,
          clearReexports,
          onDone,
        },
        code
      );
    }
  }
  const exports = Array.from(resultSet).filter((k) => {
    return validateExportVariableName(k);
  });
  cache.set(fileLoc, exports);
  return { exports };
};
