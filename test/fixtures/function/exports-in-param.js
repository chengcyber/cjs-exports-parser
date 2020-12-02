(function (exports, Object) {
  exports.a = 'a';
  exports['b'] = 'b';
  if (false) exports.c = 'c';
})(NOT_EXPORTS, NOT_OBJECT);
