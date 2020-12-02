export type ParseContext = {
  addExport: (name: string) => void;
  removeExport: (name: string) => void;
  clearExports: () => void;
  addReexport: (name: string) => void;
  // removeReexport: (name: string) => void;
  clearReexports: () => void;
  onDone?: () => void;
};
