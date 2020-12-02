// DETECTS REEXPORTS: c
module.exports = require('./bar');
((module) => (module.exports = require('./bar')))(NOT_MODULE);
if (false) module.exports = require('./foo');
