import * as babel from '@babel/core';
import traverse from '@babel/traverse';
import type { ParseContext } from './parseContext';
import { visitorCreator } from './visitor';

export const doParse = async (ctx: ParseContext, code: string) => {
  const { onDone } = ctx;
  let ast: babel.types.File | babel.types.Program | null = null;
  try {
    ast = await babel.parseAsync(code);
  } catch (e) {
    defer();
    throw e;
  }
  if (!ast) {
    throw new Error('babel parse failed');
  }
  // const afterTraverseCallbacks: (() => void)[] = [];
  traverse(
    ast,
    visitorCreator({
      testUMD: true,
      context: ctx,
      // afterTraverseCallbacks,
    })
  );

  defer();
  function defer() {
    onDone && onDone();
  }
};
