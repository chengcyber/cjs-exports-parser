// DETECTS: NO EXPORTS
Object.defineProperty(exports, 'a', {
  get() {
    return 'nope';
  },
});

if (false) {
  Object.defineProperty(module.exports, 'a', {
    get() {
      return dynamic();
    },
  });
}
