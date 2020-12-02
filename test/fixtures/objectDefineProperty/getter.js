// EXPORTS: a, b, c, d, e
Object.defineProperty(exports, 'a', {
  get: function () {
    return b;
  },
});
Object.defineProperty(exports, 'b', {
  get() {
    return b;
  },
});
Object.defineProperty(exports, 'c', {
  get: () => b,
});
Object.defineProperty(exports, 'd', {
  get() {
    return b.d;
  },
});
Object.defineProperty(exports, 'e', {
  get() {
    return 'e';
  },
});
Object.defineProperty(exports, 'f', {
  enumerable: false,
  get() {
    return 'f';
  },
});
Object.defineProperty(exports, 'g', {
  configurable: true,
  get() {
    return 'g';
  },
});
Object.defineProperty(exports, 'h', {
  get() {
    return dynamic();
  },
});
