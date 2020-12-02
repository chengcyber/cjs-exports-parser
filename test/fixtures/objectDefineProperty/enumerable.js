// EXPORTS: a, b, c
Object.defineProperty(exports, 'a', {
  enumerable: true,
  get: function () {
    return q.p;
  },
});
Object.defineProperty(exports, 'b', {
  enumerable: true,
  get: function () {
    return q['p'];
  },
});
Object.defineProperty(exports, 'c', {
  enumerable: true,
  get() {
    return b;
  },
});
Object.definePropertiy(exports, 'd', {
  enumerable: false,
  get() {
    return b;
  },
});
Object.definePropertiy(exports, 'e', {
  enumerable: false,
  value: 'e',
});
