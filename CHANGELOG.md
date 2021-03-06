# 6.2.0

- Adds `header` compiler option, used to insert arbitrary content at the top of every generated file

# 6.1.1

- Fixes string keys for objects not working in `PropTypes.oneOf`
- Adds error message for computed object keys in `PropTypes.oneOf`

# 6.1.0

- Eslint plugin: Adds warning when referencing a member expression that is not a reference to the prop types of another component.

# 6.0.0

- BREAKING: Removes support for referencing individual properties of other components' propTypes.
- BREAKING: Removes compiler option `instantiateProperties`. The option did not work across different output languages.
- BREAKING: Refactors parser API. Parsers must now apply `propTypesMeta` individually.
- BREAKING: Refactors generator API. References now have a `type` (`"ref"`) and a `ref` property that cointains the name of the referenced thing.

# 5.0.0

- BREAKING: Removes `async` option from Webpack plugin. Use the `writeToDisk` option in `webpack-dev-server` instead.
- BREAKING: Removes support for `webpack < 4`

# 4.0.1

- Adds TLDR section to README

# 4.0.0

- BREAKING (generator API): Generators are now passed the `propTypes` object instead of a `definitions` array, and must call `utils/flatten-definitions.js` manually if needed.
- BREAKING (Node.js API): The exported `generate` function has been renamed to `compile`
- Adds support for generating classes in `Kotlin` and `Typescript`. The new generators are exposed via the main export of this package (`require('@creuna/prop-types-csharp').generators`)
- Adds `fileExtension` option to Webpack plugin

# 3.0.0

- BREAKING (Node.js API): The exported `generate` function now expects two arguments instead of a single options object (`generate(sourceCode, options)`). The source code is now provided as the first argument.
- BREAKING (Webpack plugin): Formatting options (like `namespace` and `indent`) are now wrapped under `options.compilerOptions`. Consult the README.
- BREAKING (generator API): Generators are now passed three arguments instead of one (`definitions`, `className` and `options`)
- Upgrades dependencies
- Fixes [#69](https://github.com/Creuna-Oslo/prop-types-csharp/issues/69): Adds `instantiateProperties` option to Node.js API and `compilerOptions` in webpack plugin.
- Fixes [#70](https://github.com/Creuna-Oslo/prop-types-csharp/issues/70): Fixes `PropTypes.number` not defaulting to `int` in lists.
- Fixes [#71](https://github.com/Creuna-Oslo/prop-types-csharp/issues/71): Dictionaries now have type `IDictionary` instead of `Dictionary`

# 2.0.1

- Fixes [#68](https://github.com/Creuna-Oslo/prop-types-csharp/issues/68): Fixes invalid propTypes being included in generated classes when used inside `PropTypes.arrayOf`

# 2.0.0

- Fixes [#66](https://github.com/Creuna-Oslo/prop-types-csharp/issues/66): BREAKING: Removes `Item` postfix from generated classes that use `IList`

# 1.4.0

- Fixes [#65](https://github.com/Creuna-Oslo/prop-types-csharp/issues/65): Adds support for `PropTypes.objectOf`

# 1.3.0

- Fixes [#64](https://github.com/Creuna-Oslo/prop-types-csharp/issues/64): Adds support for referencing other components' propTypes

# 1.2.0

- Fixes [#63](https://github.com/Creuna-Oslo/prop-types-csharp/issues/63): Adds support for inheriting propTypes from other components using `Obejct.assign`

# 1.1.2

- Fixes some issues in the readme

# 1.1.1

- Adds new wording for error message when using imported refefences in `PropTypes.oneOf`

# 1.1.0

- Adds support for mutating propTypes in functional components

# 1.0.4

- Refactor

# 1.0.3

- Fixes `shape` and `oneOf` in deeply nested `arrayOf` not working

# 1.0.2

- Fixes issue where `Component.propTypesMeta = "exclude";` would be ignored for components with multiple exports or missing propTypes.

# 1.0.1

- Fixes component references in `PropTypes.exact` not working

# 1.0.0

[https://github.com/Creuna-Oslo/prop-types-csharp/pull/57]()

- Breaking: `Array` in propTypesMeta is no longer supported. Use array literals instead.
- Breaking: Node.js API now exports an object instead of a function.
- Breaking: Node.js generator now returns `className` instead of `componentName`.
- Adds support for `parser` option in Node.js API and Webpack plugin.
- Adds typescript parser.

# 0.6.5

- Fixes [issue 54](https://github.com/Creuna-Oslo/prop-types-csharp/issues/54): incorrect C# generated from nested `PropTypes.shape` in `PropTypes.arrayOf`
- Fixes [issue 55](https://github.com/Creuna-Oslo/prop-types-csharp/issues/55): incorrect C# generated from `PropTypes.arrayOf(PropTypes.oneOf())`

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
