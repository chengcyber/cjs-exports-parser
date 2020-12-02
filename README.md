# cjs-exports-parser

Parse cjs exports

# Usage

```
npm install cjs-exports-parser
```

```js
import { parseCode } from 'cjs-exports-parser';

const { exports, reexports } = parseCode(`
  // named exports detection
  module.exports.a = 'a';
  (function () {
    exports.b = 'b';
  })();
  Object.defineProperty(exports, 'c', { value: 'c' });
  /* exports.d = 'not detected'; */

  // reexports detection
  if (maybe) module.exports = require('./dep1.js');
  if (another) module.exports = require('./dep2.js');

  // literal exports assignments
  module.exports = { a, b: c, d, 'e': f }

  // __esModule detection
  Object.defineProperty(module.exports, '__esModule', { value: true })
`);
```

or

```js
import { parseFile } from 'cjs-exports-parser';

const { exports } = await parseFile('/absolute/path/to/your/file.js');
```

`parseFile` does not return `reexports`, because it automaticlly invokes recurrsively to collect `exports`.

# Cases

## Named Exports Parsing

```js
// DETECTS EXPORTS: a, b
(function (exports) {
  exports.a = 'a';
  exports['b'] = 'b';
})(exports);
```

❗️Could not opt-out property in falsy branch:

```js
exports.a = 'a';
exports['b'] = 'b';
if (false) exports.c = 'c';
```

❗️Could not opt-out `exports` as param name explicitly:

```js
// DETECTS EXPORTS: a, b, c
(function (exports, Object) {
  exports.a = 'a';
  exports['b'] = 'b';
  if (false) exports.c = 'c';
})(NOT_EXPORTS, NOT_OBJECT);
```

Could detects exports as function parameter and use another formal variable name:

```js
// DETECTS: a, b
(function (e) {
  e.a = 'a';
  e['b'] = 'b';
})(exports);
```

```js
// DETECTS EXPORTS: NO EXPORTS
(function (exports, Object) {
  exports.a = 'a';
  exports['b'] = 'b';
  if (false) exports.c = 'c';
})(NOT_EXPORTS, NOT_OBJECT);
```

## Getter Exports Parsing

`Object.defineProperty` are suppored, in this following cases the property will be taken into exports:

1. if `enumerable` exists, it must be `true` in descriptor

2. contains `value` or `getter`;
   a. if `value` exists in descriptor
   b. if `getter` exists, function must return `Identifier` or `MemberExpression` or `StringLiteral`

3. no other properties exists in descriptor

```js
// DETECTS: a, b, c, d, e, __esModule
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
Object.defineProperty(exports, 'd', { value: 'd' });
Object.defineProperty(exports, 'e', {
  enumerable: true,
  get() {
    return 'str';
  },
});
Object.defineProperty(exports, '__esModule', { value: true });
```

❗️To avoid matching getters that have side effects, any getter for an export name that does not support the forms above will opt-out of the getter matching:

```js
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
```

❗️Alternative object definition structures or getter function bodies are not detected:

```js
// DETECTS: NO EXPORTS
Object.defineProperty(exports, 'a', {
  enumerable: false,
  get() {
    return p;
  },
});
Object.defineProperty(exports, 'b', {
  configurable: true,
  get() {
    return p;
  },
});
Object.defineProperty(exports, 'c', {
  get: () => p,
});
Object.defineProperty(exports, 'd', {
  enumerable: true,
  get: function () {
    return dynamic();
  },
});
```

❗️`Object.defineProperties` is also not supported.

## Exports Object Parsing

❗️spreads are ignored

```js
// DETECTS EXPORTS: a, b, c
module.exports = {
  a,
  b: b,
  c: c,
  ...d,
};
```

```js
// DETECTS EXPORTS: a, b, c
module.exports = {
  a,
  ...d,
  b: require('c'),
  c: 'c',
};
```

## module.exports reexport assignment

Any `module.exports = require('mod')` assignment is detected as a reexport, but only the last one is returned:

```js
// DETECTS REEXPORTS: c
module.exports = require('a');
((module) => (module.exports = require('b')))(NOT_MODULE);
if (false) module.exports = require('c');
```

```js
// DETECTS REEXPORTS: a, b
module.exports = require('ignored');
module.exports = {
  ...require('a'),
  ...require('b'),
};
```

## Transpiler reexports

`babel`, `TS` and other bundlers would like to inject reexport helper functions

`babel`:

```js
// DETECT REEXPORTS: 'external'
'use strict';

exports.__esModule = true;

var _external = require('external');

Object.keys(_external).forEach(function (key) {
  if (key === 'default' || key === '__esModule') return;
  exports[key] = _external[key];
});
```

`TS`:

```js
'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !exports.hasOwnProperty(p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
__exportStar(require('./foo'), exports);
```

# NOTE

Normally, the results are more accurate than `cjs-module-lexer` since `cjs-exports-parser` do further analysis via `babel`, but if you do care about performance pretty much, please give `cjs-module-lexer` a try.

# LICENSE

MIT
