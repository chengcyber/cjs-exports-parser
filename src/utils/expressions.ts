import * as babel from '@babel/core';
import * as t from '@babel/types';
export function isTestExportsExp(
  n: babel.types.Expression | babel.types.PrivateName
) {
  let hasTestExports = false;
  if (
    t.isUnaryExpression(n) &&
    n.operator === 'typeof' &&
    t.isIdentifier(n.argument)
  ) {
    if (n.argument.name === 'exports') {
      hasTestExports = true;
    }
  }
  return hasTestExports;
}

export function isTestModuleExp(
  n: babel.types.Expression | babel.types.PrivateName
) {
  let hasTestModule = false;
  if (
    t.isUnaryExpression(n) &&
    n.operator === 'typeof' &&
    t.isIdentifier(n.argument)
  ) {
    if (n.argument.name === 'module') {
      hasTestModule = true;
    }
  }
  return hasTestModule;
}

/**
 *
 * 'object' === typeof exports && 'undefined' !== typeof module
 * @param exp
 */
export function isTestExportsAndModuleExp(exp: babel.types.LogicalExpression) {
  const left = exp.left;
  const right = exp.right;
  const resultLeft = isTestExportsOrModuleExp(left);
  const resultRight = isTestExportsOrModuleExp(right);

  const hasTestExportsAndModule =
    (resultLeft.hasTestExports || resultRight.hasTestExports) &&
    (resultLeft.hasTestModule || resultRight.hasTestModule);
  return hasTestExportsAndModule;
}

function isTestExportsOrModuleExp(exp: babel.types.Expression) {
  let hasTestExports = false;
  let hasTestModule = false;
  if (t.isBinaryExpression(exp)) {
    if (exp.operator === '==' || exp.operator === '===') {
      const left2 = exp.left;
      const right2 = exp.right;
      hasTestExports = hasTestExports || isTestExportsExp(left2);
      hasTestExports = hasTestExports || isTestExportsExp(right2);
    }
    if (exp.operator === '!=' || exp.operator === '!==') {
      const left2 = exp.left;
      const right2 = exp.right;
      hasTestModule = hasTestModule || isTestModuleExp(left2);
      hasTestModule = hasTestModule || isTestModuleExp(right2);
    }
  }
  return {
    hasTestExports,
    hasTestModule,
  };
}

/**
 * Usage:
 * const isObjectDefinePropertyExpression = isSpecifiedMemeberExpression2Creator('Object', 'defineProperty');
 */
function isSpecifiedMemberExpression2Creator(a: string, b: string) {
  return (exp: any) => {
    let isSpecified = false;
    if (t.isMemberExpression(exp)) {
      const object = exp.object;
      const property = exp.property;
      if (
        t.isIdentifier(object) &&
        object.name === a &&
        t.isIdentifier(property) &&
        property.name === b
      ) {
        isSpecified = true;
      }
    }
    return isSpecified;
  };
}

export const isObjectDefinePropertyMemberExpression = isSpecifiedMemberExpression2Creator(
  'Object',
  'defineProperty'
);

export const isObjectKeysMemberExpression = isSpecifiedMemberExpression2Creator(
  'Object',
  'keys'
);

export const isModuleExportsMemberExpression = isSpecifiedMemberExpression2Creator(
  'module',
  'exports'
);

export const isExportsIdentifier = (
  n: any,
  exportsIdentifiers: (string | undefined)[]
) => {
  let isExports = false;
  if (t.isIdentifier(n)) {
    if (exportsIdentifiers.filter(Boolean).includes(n.name)) {
      isExports = true;
    }
  }
  return isExports;
};

/**
 * require('./foo') returns './foo'
 * otherwise, returns null
 * @param n CallExpression maybe
 */
export const tryExtractRequirePath = (n: any): string | null => {
  let ret: string | null = null;
  if (t.isCallExpression(n)) {
    const callee = n.callee;
    const args = n.arguments;
    if (t.isIdentifier(callee) && callee.name === 'require') {
      const arg0 = args[0];
      if (arg0 && t.isStringLiteral(arg0)) {
        const externalModulePath = arg0.value;
        ret = externalModulePath;
      }
    }
  }
  return ret;
};
