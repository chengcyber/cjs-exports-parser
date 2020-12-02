!(function (t, e) {
  'object' == typeof exports && 'undefined' != typeof module
    ? e(exports)
    : 'function' == typeof define && define.amd
    ? define(['exports'], e)
    : e((t = t || self));
})(this, function (t) {
  'use strict';
  t.umd = 'umd';
  t.min = 'min';
});
