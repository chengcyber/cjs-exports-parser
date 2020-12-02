/**
 * invalid @@abc, 2abc
 */
export function validateExportVariableName(n: string) {
  return /^[$_a-zA-Z][$_\w]*/.test(n);
}
