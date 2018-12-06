# 0.6.4

- Adds support for new string literals in `propTypesMeta`: `"int?"`, `"float?"`, `"double"` and `"double?"` ([issue 52](https://github.com/Creuna-Oslo/prop-types-csharp/issues/52) and [issue 53](https://github.com/Creuna-Oslo/prop-types-csharp/issues/53) )

# 0.6.3

- Fixes eslint plugin not respecting `propTypesMeta = 'exclude';` ([issue 50](https://github.com/Creuna-Oslo/prop-types-csharp/issues/50))
- Refactors eslint plugin message handling to fix false positives in tests ([issue 51](https://github.com/Creuna-Oslo/prop-types-csharp/issues/51))

# 0.6.2

- Fixes Webpack plugin crashing when in async mode and output directory doesn't exist ([issue 48](https://github.com/Creuna-Oslo/prop-types-csharp/issues/48))
- Fixes missing support for `PropTypes.exact` ([issue 49](https://github.com/Creuna-Oslo/prop-types-csharp/issues/49))

# 0.6.1

- Fixes misleading example of Webpack plugin config in readme

# 0.6.0

- Adds support for using `"exclude"` as the value for `propTypesMeta`, which will exclude a component from class generation ([issue 46](https://github.com/Creuna-Oslo/prop-types-csharp/issues/46));
- Fixes [issue 44](https://github.com/Creuna-Oslo/prop-types-csharp/issues/44): `PropTypes.node` not being ignored in `PropTypes.arrayOf`.
- Fixes [issue 45](https://github.com/Creuna-Oslo/prop-types-csharp/issues/45): Eslint plugin crashing when typing 'propTypesMeta' in class components.

# 0.5.4

- Fixes `exclude` meta not being respected for `PropTypes.oneOfType`

# 0.5.3

- Fixes eslint plugin crashing on `PropTypes.shape()` (without arguments)

# 0.5.2

- Fixes `Unsupported method 'Object.entries'` being thrown for excluded props

# 0.5.1

[https://github.com/Creuna-Oslo/prop-types-csharp/pull/42]()

- When using `Object.values` in `PropTypes.oneOf`, the object keys will now be used as property names in generated enums, instead of the property values. Object values will still be used as enum string values

# 0.5.0

[https://github.com/Creuna-Oslo/prop-types-csharp/pull/41]()

- Complete refactor of propType manipulation and stringification
  - This might cause breakage, in which case please submit an [issue](https://github.com/Creuna-Oslo/prop-types-csharp/issues)
- Adds `generator` option to Node.js API
- Adds support for object literals in `Array` meta

# 0.4.0

- "Major" version bump because it turns out `0.3.6` was a breaking change.
- If you previously relied on classes being generated when running webpack dev server, you should set the `async` option to `true` when running WDS. See [README.md](README.md#webpack)

# 0.3.6

- Adds support for `async` option in webpack plugin
- Removes automatic inference of async through webpack mode
