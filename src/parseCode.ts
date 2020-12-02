import { doParse } from './doParse';

export interface ParseCodeResult {
  /**
   * export variable name list
   */
  exports: string[];
  /**
   * reexport dependency fileLoc list
   * @example ['./dep1', './dep2.js']
   */
  reexports: string[];
}

export const parseCode = async (code: string): Promise<ParseCodeResult> => {
  const exportSet = new Set<string>();
  const reexportSet = new Set<string>();
  const addExport = (name: string) => {
    exportSet.add(name);
  };
  const removeExport = (name: string) => {
    exportSet.delete(name);
  };
  const clearExports = () => {
    exportSet.clear();
  };
  const addReexport = (name: string) => {
    reexportSet.add(name);
  };
  // const removeReexport = (name: string) => {
  //   reexportSet.delete(name);
  // };
  const clearReexports = () => {
    reexportSet.clear();
  };
  await doParse(
    {
      addExport,
      removeExport,
      clearExports,
      addReexport,
      // removeReexport,
      clearReexports,
    },
    code
  );
  const exports = Array.from(exportSet);
  const reexports = Array.from(reexportSet);
  return {
    exports,
    reexports,
  };
};
