// DETECTS REEXPORTS: foo, bar
module.exports = require('./ignored');
module.exports = {
  ...require('./foo'),
  ...require('./bar'),
};
