import * as t from '@babel/types';
import {
  isObjectDefinePropertyMemberExpression,
  isObjectKeysMemberExpression,
  isModuleExportsMemberExpression,
  isTestExportsAndModuleExp,
  tryExtractRequirePath,
  isExportsIdentifier,
} from './utils/expressions';
import type { NodePath } from '@babel/core';
import type { ParseContext } from './parseContext';

type VisitorCreatorParams = {
  context: ParseContext;
  testUMD: boolean;
  exportsAliasName?: string;
  // afterTraverseCallbacks?: (() => void)[];
};

type BlockStatmentNodePath = NodePath<Extract<t.BlockStatement, { type: any }>>;

export function visitorCreator({
  context,
  testUMD,
  exportsAliasName,
}: VisitorCreatorParams) {
  const {
    addExport,
    removeExport,
    addReexport,
    clearExports,
    clearReexports,
  } = context;
  const localNameToExternalModulePath = new Map<string, string>();
  return {
    VariableDeclaration: (
      path: NodePath<Extract<t.VariableDeclaration, { type: any }>>
    ) => {
      // var _foo = require('./foo');
      const d = path.node.declarations[0];
      if (!d) {
        return;
      }
      let externalModuleLocalName = '';
      const init = d.init;
      const externalModulePath = tryExtractRequirePath(init);
      if (externalModulePath) {
        if (t.isIdentifier(d.id)) {
          // _foo
          externalModuleLocalName = d.id.name;
        }
      }
      if (externalModuleLocalName && externalModulePath) {
        localNameToExternalModulePath.set(
          externalModuleLocalName,
          externalModulePath
        );
      }
    },
    AssignmentExpression: (
      path: NodePath<Extract<t.AssignmentExpression, { type: any }>>
    ) => {
      const left = path.node.left;
      const right = path.node.right;
      if (t.isMemberExpression(left)) {
        const object = left.object;
        const property = left.property;
        // module.exports.foo = xxx
        const isModuleExports = isModuleExportsMemberExpression(object);
        // exports.foo
        const isExports = isExportsIdentifier(object, [
          'exports',
          exportsAliasName,
        ]);

        if (isModuleExports || isExports) {
          if (t.isIdentifier(property)) {
            // foo
            addExport(property.name);
          }
          if (t.isStringLiteral(property)) {
            // ['foo']
            addExport(property.value);
          }
        }
      }

      // module.exports = xxx | exports = xxx
      const isModuleExports = isModuleExportsMemberExpression(left);
      const isExports = isExportsIdentifier(left, [
        'exports',
        exportsAliasName,
      ]);
      if (isModuleExports || isExports) {
        // test right operator: require('xxx')
        const externalModulePathMaybe = tryExtractRequirePath(right);
        if (externalModulePathMaybe) {
          // module.exports = require('xxx');
          clearExports();
          clearReexports();
          addReexport(externalModulePathMaybe);
        }

        // test right operator: = { ... }
        if (t.isObjectExpression(right)) {
          clearExports();
          clearReexports();
          const keyValueTypePairs = new Map<
            string,
            'identifier' | 'stringLiteral' | 'requireExternal'
          >();
          for (const prop of right.properties) {
            if (t.isObjectProperty(prop)) {
              const objProp = prop;
              if (t.isIdentifier(objProp.key)) {
                const keyName = objProp.key.name;
                // { a: b }
                if (t.isIdentifier(objProp.value)) {
                  keyValueTypePairs.set(keyName, 'identifier');
                }
                // { a: 'a' }
                if (t.isStringLiteral(objProp.value)) {
                  keyValueTypePairs.set(keyName, 'stringLiteral');
                }
                // { a: require('./xxx') }
                const externalModulePath = tryExtractRequirePath(objProp.value);
                if (externalModulePath) {
                  keyValueTypePairs.set(keyName, 'requireExternal');
                }
              }
            }
            if (t.isSpreadElement(prop)) {
              const externalModulePathMaybe = tryExtractRequirePath(
                prop.argument
              );
              if (externalModulePathMaybe) {
                addReexport(externalModulePathMaybe);
              }
            }
          }
          for (const [k, v] of Array.from(keyValueTypePairs.entries())) {
            switch (v) {
              case 'requireExternal':
              case 'stringLiteral':
              case 'identifier': {
                addExport(k);
                break;
              }
              default:
                const _v: never = v;
                console.error(`valueType ${_v} is missing handler`);
            }
          }
        }
      }
    },
    CallExpression: (
      path: NodePath<Extract<t.CallExpression, { type: any }>>
    ) => {
      const callee = path.node.callee;
      const args = path.node.arguments;
      /**
       * __exportStar(require("./foo"), exports)
       */
      if (t.isIdentifier(callee) && callee.name === '__exportStar') {
        if (t.isIdentifier(args[1]) && args[1].name === 'exports') {
          const externalModulePath = tryExtractRequirePath(args[0]);
          if (externalModulePath) {
            addReexport(externalModulePath);
          }
        }
      }

      /**
       * Babel transpiled export *
       * i.e.
       * Object.keys(_foo).forEach(function (key) {
       *   if (key === 'default' || key === '__esModule') return;
       *   if (key in exports && exports[key] === _foo[key]) return;
       *   Object.defineProperty(exports, key, {
       *     enumerable: true,
       *     get: function get() {
       *       return _foo[key];
       *     }
       *   })
       * })
       */
      if (t.isMemberExpression(callee)) {
        // Object.keys(_foo).forEach
        // 1. Object.keys && forEach
        // 2. _foo exists in localNameToExternalModulePath
        let isExternalIteration = false;
        let isBabelExport = false;
        let externalModulePath = '';
        const property = callee.property;
        const object = callee.object;
        if (t.isIdentifier(property) && property.name === 'forEach') {
          if (t.isCallExpression(object)) {
            const callee2 = object.callee;
            if (isObjectKeysMemberExpression(callee2)) {
              const arg0 = object.arguments[0];
              if (t.isIdentifier(arg0)) {
                const externalModuleLocalNameMaybe = arg0.name;
                const _externalModulePath = localNameToExternalModulePath.get(
                  externalModuleLocalNameMaybe
                );
                if (_externalModulePath) {
                  isExternalIteration = true;
                  externalModulePath = _externalModulePath;
                }
              }
            }
          }
        }

        if (isExternalIteration) {
          const arg0 = args[0];
          if (t.isFunctionExpression(arg0)) {
            /**
             * Code sturcture:
             * if xxx
             * if xxx
             * Object.defineProperty
             */
            if (
              t.isIfStatement(arg0.body.body[0]) &&
              t.isIfStatement(arg0.body.body[1]) &&
              t.isExpressionStatement(arg0.body.body[2])
            ) {
              const expStat = arg0.body.body[2];
              const exp = expStat.expression;
              if (t.isCallExpression(exp)) {
                if (
                  t.isMemberExpression(exp.callee) &&
                  isObjectDefinePropertyMemberExpression(exp.callee)
                ) {
                  isBabelExport = true;
                }
              }
            }
          }
          if (isBabelExport && externalModulePath) {
            addReexport(externalModulePath);
          }
        }
      }

      /**
       * Object.defineProperty(exports, 'a', {})
       */
      if (t.isMemberExpression(callee)) {
        if (isObjectDefinePropertyMemberExpression(callee)) {
          const exportsMaybe = args[0];
          const candidateKeyMaybe = args[1];
          const descriptor = args[2];

          let candidateKey = '';
          if (t.isStringLiteral(candidateKeyMaybe)) {
            candidateKey = candidateKeyMaybe.value;
          }

          if (
            candidateKey &&
            (isModuleExportsMemberExpression(exportsMaybe) ||
              isExportsIdentifier(exportsMaybe, ['exports', exportsAliasName]))
          ) {
            if (t.isObjectExpression(descriptor)) {
              const objProps = descriptor.properties;
              const keyToValueNode = new Map<
                string,
                t.ObjectProperty['value']
              >();
              for (const objProp of objProps) {
                if (t.isObjectProperty(objProp)) {
                  if (t.isIdentifier(objProp.key)) {
                    const key = objProp.key.name;
                    const valueNode = objProp.value;
                    keyToValueNode.set(key, valueNode);
                  }
                }

                if (t.isObjectMethod(objProp)) {
                  if (t.isIdentifier(objProp.key)) {
                    const key = objProp.key.name;
                    const vn = t.functionExpression(
                      null,
                      objProp.params,
                      objProp.body
                    );
                    keyToValueNode.set(key, vn);
                  }
                }
              }

              // check enumberable
              let checkEnum = true;
              const enumValueNode = keyToValueNode.get('enumerable');
              if (enumValueNode) {
                checkEnum = false;
                if (t.isBooleanLiteral(enumValueNode) && enumValueNode.value) {
                  checkEnum = true;
                }
              }

              // check value
              let checkValue = false;
              const valueValueNode = keyToValueNode.get('value');
              if (valueValueNode) {
                checkValue = true;
              }

              // check getter
              let checkGetter = false;
              const getterValueNode = keyToValueNode.get('get');
              if (getterValueNode) {
                if (
                  t.isFunctionExpression(getterValueNode) ||
                  t.isArrowFunctionExpression(getterValueNode)
                ) {
                  if (t.isBlockStatement(getterValueNode.body)) {
                    const stats = getterValueNode.body.body;
                    const retStats = stats.filter((s) =>
                      t.isReturnStatement(s)
                    ) as t.ReturnStatement[];
                    const retStat = retStats[0];
                    if (retStat) {
                      const retArg = retStat.argument;
                      if (acceptGetterReturnType(retArg)) {
                        checkGetter = true;
                      }
                    }
                  }
                  if (acceptGetterReturnType(getterValueNode.body)) {
                    checkGetter = true;
                  }
                }
              }

              // check other
              let checkOther = true;
              const configurableValueNode = keyToValueNode.get('configurable');
              if (configurableValueNode) {
                checkOther = false;
              }

              if (checkEnum && (checkValue || checkGetter) && checkOther) {
                addExport(candidateKey);
              } else {
                removeExport(candidateKey);
              }
            }
          }
        }
      }

      /**
       * (function(t) {
       * })(exports)
       */
      if (t.isFunctionExpression(callee)) {
        // FIXME: There is edge case - multiple exports, module.exports. but it is too compliated for now
        const exportsRenameArgIndex = args.findIndex((item) => {
          return (
            isExportsIdentifier(item, ['exports']) ||
            isModuleExportsMemberExpression(item)
          );
        });
        let exportsFuncArgName = '';
        if (exportsRenameArgIndex >= 0) {
          const renameParam = callee.params[exportsRenameArgIndex];
          if (t.isIdentifier(renameParam)) {
            exportsFuncArgName = renameParam.name;
          }

          const bodyPath = path.get('callee.body') as BlockStatmentNodePath;
          if (bodyPath) {
            bodyPath.traverse(
              visitorCreator({
                context,
                testUMD: false,
                exportsAliasName: exportsFuncArgName,
              })
            );
          }
        }
      }

      /**
       * UMD wrapper detection
       */
      if (t.isFunctionExpression(callee)) {
        if (testUMD) {
          // UMD
          const expStat = callee.body.body[0];
          let isUMD = false;
          let aliasName = '';
          if (
            expStat &&
            t.isExpressionStatement(expStat) &&
            t.isConditionalExpression(expStat.expression)
          ) {
            const test = expStat.expression.test;
            let hasTestExportsAndModule = false;
            // 'object' === typeof exports && 'undefined' !== typeof module
            if (t.isLogicalExpression(test)) {
              hasTestExportsAndModule =
                hasTestExportsAndModule || isTestExportsAndModuleExp(test);
            }
            if (hasTestExportsAndModule) {
              const thisMaybe = args[0];
              if (t.isThisExpression(thisMaybe)) {
                // 获取 exports 的别名
                const factoryFuncExp = args[1];
                if (t.isFunctionExpression(factoryFuncExp)) {
                  const firstParam = factoryFuncExp.params[0];
                  if (t.isIdentifier(firstParam)) {
                    aliasName = firstParam.name;
                    /**
                     * 含有 xxx === typeof exports && xxx === typoef module,
                     * (可以 == 或者 ===, && 顺序可呼唤, === 顺序可互换)
                     * 且第一个参数是 this, 第二个是 factory 函数
                     * 以上都符合, 则认为是 UMD 的 wrapper 函数
                     */
                    isUMD = true;
                  }
                }
              }
            }
          }

          if (isUMD) {
            const umdFuncExp = args[1];
            if (t.isFunctionExpression(umdFuncExp)) {
              const bodyPath = path.get(
                'arguments.1.body'
              ) as BlockStatmentNodePath;
              if (bodyPath) {
                bodyPath.traverse(
                  visitorCreator({
                    context,
                    testUMD: false,
                    exportsAliasName: aliasName,
                  })
                );
              }
            }
          }
        }
      }
    },
  };
}

function acceptGetterReturnType(retArg: any) {
  return (
    t.isMemberExpression(retArg) ||
    t.isStringLiteral(retArg) ||
    t.isIdentifier(retArg)
  );
}
