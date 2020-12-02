// EXPORTS: a, b, c, d
module.exports = {
  a,
  ...e,
  b: require('./foo'),
  c: require('./bar'),
  d: 'd',
};
