# PropTypes C# Webpack Plugin

[![Travis status](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin.svg?branch=master)](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin)

A Webpack plugin that generates C# classes from React component propTypes

This is a work in progress!

```
yarn add @creuna/prop-types-csharp-webpack-plugin
```

## Usage

The plugin will extract PropType definitions from `.jsx` files and convert them into C# class files.

### Excluded propTypes

Props of type `func`, `element`, `node` and `instanceOf` are excluded when creating classes

### Illegal propTypes

Props of type `number` and `object` are ambiguous and cannot be included in C# classes as-is.

`number` should have a `propTypesMeta` definition (see below). `object` should be replaced by a `shape` containing an object literal or another component's propTypes. Alternatively, `number` or `object` can be excluded using `propTypesMeta`

### Excluding propTypes

You can exclude props from generated classes using `propTypesMeta` (see below)

### propTypesMeta

`propTypesMeta` can be used to exclude some props from C# classes or to provide type hints for ambiguous types.

Supported values for props in `propTypesMeta` are `"int"`, `"float"` and `"exclude"`

Functional component:

```jsx
const Component = () => <div />;

Component.propTypes = {
  someProp: PropTypes.number,
  anotherProp: PropTypes.string
};

Component.propTypesMeta = {
  someProp: "int",
  anotherProp: "exclude"
};
```

Class component:

```jsx
class Component extends React.Component {
  static propTypes = {
    someProp: PropTypes.number,
    anotherProp: PropTypes.string
  };

  static propTypesMeta = {
    someProp: "float",
    anotherProp: "exclude"
  };
}
```

### Running in development mode

Running this in development is not recommended, as it may slow down your build.

### Config example

```js
const PropTypesCSharpPlugin = require('@creuna/prop-types-csharp-plugin');

module.exports = function(env, options = {}) {
  const production = options.mode === 'production';

  return {
    entry: { ... },
    output: { ... },
    module: { ... },
    plugins: production ? [new PropTypesCSharpPlugin()] : []
  };
};
```

## Options: `Object`

### path: `String`

Path relative to `output.path` to put `.cs` files.
