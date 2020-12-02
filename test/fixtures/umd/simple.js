(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
    ? define(['exports'], factory)
    : ((global = global || self), factory((global.React = {})));
})(this, function (_exports) {
  // normally exports, changes to _exports just for test
  _exports.umd = 'umd';
});
