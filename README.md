# PropTypes C# Webpack Plugin

[![Travis status](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin.svg?branch=master)](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin)

A Webpack plugin that generates C# classes from React component propTypes

This is a work in progress!

```
yarn add @creuna/prop-types-csharp-webpack-plugin
```

## Usage

The plugin will extract PropType definitions from `.jsx` files and convert them into C# class files.

### Config example

```js
const PropTypesCSharpPlugin = require('@creuna/prop-types-csharp-plugin');

module.exports = function(env, options = {}) {
  const production = options.mode === 'production';

  return {
    entry: { ... },
    output: { ... },
    module: { ... },
    plugins: production ? [new PropTypesCSharpPlugin({
      path: 'classes',
      match: [/\.jsx$/, 'source/components'],
      exclude: ['node_modules', 'some/path']
    })] : []
  };
};
```

### Options: `Object`

**exclude**: `Array` of `String | RegExp` = `['node-modules']`

Use this to exclude paths or files from class generation. Default is replaced when setting this.

**log**: `Boolean` = `false`

If set to true, will output some information about the plugin to the shell.

**match**: `Array` of `String | RegExp` = `[/\.jsx$/]`

Use this to choose what files to include when generating classes. Default is replaced when setting this.

**path**: `String`

Path relative to `output.path` to put `.cs` files.

### Webpack modes

Depending on `webpack.options.mode`, the plugin will do one of the following:

- `production`: Writes `.cs` files to disk, Webpack build is aborted on errors.
- `development`: Does not write files, runs in parallel, warns instead of throwing errors.

### Ignored props

Props of type `func`, `element`, `node` and `instanceOf` are ignored when creating classes because they make no sense in C#-land.

### Illegal propTypes

Props of type `number`, `object` and `array` are ambiguous and cannot be included in C# classes as-is.

`number` should have a `propTypesMeta` definition (see below).

`object` should have a meta type or be replaced by a `shape` containing an object literal or another component's propTypes.

`array` should be replaced by an `arrayOf` or have a `propTypesMeta` definition.

`oneOfType` is currently also illegal until we figure out how to deal with it.

### propTypesMeta

`propTypesMeta` can be used to exclude some props from C# classes or to provide type hints for ambiguous types.

Supported values for props in `propTypesMeta` are

- `"int"`
- `"float"`
- `"exclude"`
- React component name
- Array(<React component name>)

Functional component:

```jsx
const Component = () => <div />;

Component.propTypes = {
  someProp: PropTypes.number,
  anotherProp: PropTypes.string,
  items: PropTypes.array
};

Component.propTypesMeta = {
  someProp: "int",
  anotherProp: "exclude",
  items: Array(SomeComponent)
};
```

Class component:

```jsx
class Component extends React.Component {
  static propTypes = {
    someProp: PropTypes.number,
    anotherProp: PropTypes.string,
    items: PropTypes.array
  };

  static propTypesMeta = {
    someProp: "float",
    anotherProp: "exclude",
    items: Array(SomeComponent)
  };
}
```

### Babel plugin

Having a bunch of `propTypesMeta` scattered all around your production code might not be what you want. To solve this issue, a Babel plugin is included which, if enabled, will strip all instances of `ComponentName.propTypesMeta` or `static propTypesMeta` when building with Webpack.

**.babelrc**:

```json
{
  "plugins": ["@creuna/prop-types-csharp-webpack-plugin/babel-plugin"]
}
```
