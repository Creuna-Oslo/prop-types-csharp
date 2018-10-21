# PropTypes to C# class generator

[![Travis status](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin.svg?branch=master)](https://travis-ci.org/Creuna-Oslo/prop-types-csharp-webpack-plugin)

This package has tools for generating C# classes from React components using propTypes.

## Table of contents

- [General concepts](#general)
- [About generated classes](#classes)
- [Node.js API](#node)
- [Webpack plugin](#webpack)
- [Babel plugin](#babel)
- [eslint plugin](#eslint)

```
yarn add @creuna/prop-types-csharp
```

## <a id="general"></a> General concepts

### Ignored props

Props of type `func`, `element`, `node` and `instanceOf` are ignored when creating classes because they make no sense in C#-land.

### Illegal propTypes

Props of type `object` and `array` are ambiguous and cannot be included in C# classes as-is.

**object**

`object` should be replaced with `shape` or a `propTypesMeta` definition. Using the propTypes of another component is usually the best choice when passing props to child components:

```jsx
const Component = ({ link }) => <Link {...link} />;

Compontent.propTypes = {
  link: PropTypes.shape(Link.propTypes) // Reference to Link component
};
```

The above example will result in a C# class that has a reference to the C# class for `Link`, which means the definition of `Link` is now re-used which is nice:

```cs
public class Component {
  public Link Link { get; set; }
}
```

**array**

`array` should be replaced by an `arrayOf` or have a `propTypesMeta` definition.

**oneOfType**

`oneOfType` is currently also illegal until we figure out how to deal with it.

### propTypesMeta

In general, it's recommended to define as much as possible in `propTypes`. In some cases however, that might be difficult, and in those cases `propTypesMeta` can be helpful.

`propTypesMeta` can be used to exclude some props from C# classes or to provide type hints for ambiguous types.

Supported values for props in `propTypesMeta` are

- `"int"`
- `"float"`
- `"exclude"`
- React component
- Array(< React component >)

`"int"` and `"float"` replace `PropTypes.number` if supplied. By default, `PropTypes.number` will result in `int` in C# classes.

Functional component:

```jsx
const Component = () => <div />;

Component.propTypes = {
  someProp: PropTypes.number,
  anotherProp: PropTypes.string,
  someComponent: PropTypes.object,
  items: PropTypes.array
};

Component.propTypesMeta = {
  someProp: "float",
  anotherProp: "exclude",
  someComponent: SomeComponent,
  items: Array(AnotherComponent)
};
```

Class component:

```jsx
class Component extends React.Component {
  static propTypes = {
    someProp: PropTypes.number,
    anotherProp: PropTypes.string,
    someComponent: PropTypes.object,
    items: PropTypes.array
  };

  static propTypesMeta = {
    someProp: "float",
    anotherProp: "exclude",
    someComponent: SomeComponent,
    items: Array(AnotherComponent)
  };
}
```

## <a id="classes"></a> About generated classes

### Enums

Generated enums look like this:

```cs
public enum Theme
{
  [EnumMember(Value = "theme-blue")]
  ThemeBlue = 0
}
```

This allows for the passing of magic strings from C# to React. To get this working with serialization, set the following in the Application_Start:

```cs
using Newtonsoft.Json.Converters;

ReactSiteConfiguration.Configuration
  .SetJsonSerializerSettings(new JsonSerializerSettings
  {
      Converters = new List<JsonConverter> { new StringEnumConverter() }
  });
```

## <a id="node"></a>Node.js API

The Node API exports one function that takes an option object.

### Returns

Returns an `object` containing:

**componentName**: `String`
Name of React component (derived from export declaration).

**code**: `String`
Source code for new C# class.

### Options

**baseClass**: `String`

Optional base class that generated classes will extend

**generator**: `Function` = `lib/stringify/lang/csharp`

Optional generator. Use this if you want to generate something other than C#. The Node.js API options are passed to the generator, in addition to `componentName` (`string`) and `definitions` – an `array` with abstract representations of the component class and any child classes.

**indent**: `Number` = `2`
Number of spaces of indentation in generated C# file

**namespace**: `String`
Optional namespace to wrap around generated C# class

**sourceCode**: `String`
Source code of a React component as string.

### Example

```js
const generateCSharp = require("@creuna/prop-types-csharp");

const { componentName, code } = generateCSharp({
  indent: 4,
  namespace: "Some.Awesome.Namespace",
  sourceCode: "" // Insert actual React component source code
});
```

## <a id="webpack"></a>Webpack plugin

The plugin will extract PropType definitions from `.jsx` files and convert them into C# class files. If the build already has errors when this plugin runs, it aborts immediately.

### Config example

```js
const PropTypesCSharpPlugin = require('@creuna/prop-types-csharp-plugin');

module.exports = function(env, options = {}) {
  return {
    entry: { ... },
    output: { ... },
    module: { ... },
    plugins: [
      new PropTypesCSharpPlugin({
        path: 'classes',
        match: [/\.jsx$/, 'source/components'],
        exclude: ['node_modules', 'some/path']
      })
    ]
  };
};
```

### Options: `Object`

**async**: `Boolean` = `false`

It's recommended to set this to true when running with webpack dev server for these reasons:

- The build can finish before class generation is complete, meaning faster hot reloading of the browser
- Classes are written to disk by the plugin (Webpack dev server only writes to memory)

**exclude**: `Array` of `String | RegExp` = `['node-modules']`

Use this to exclude paths or files from class generation. Default is replaced when setting this.

**indent**: `Number` = `2`

Number of spaces of indentation in generated classes.

**log**: `Boolean` = `false`

If set to true, will output some information about the plugin to the shell.

**match**: `Array` of `String | RegExp` = `[/\.jsx$/]`

Use this to choose what files to include when generating classes. Default is replaced when setting this.

**namespace**: `String`

If supplied, all generated classes will be wrapped in this namespace.

**path**: `String`

Path relative to `output.path` to put `.cs` files.

## <a id="babel"></a>Babel plugin

Having a bunch of `propTypesMeta` scattered all around your production code might not be what you want. To solve this issue, a Babel plugin is included which, if enabled, will strip all instances of `ComponentName.propTypesMeta` or `static propTypesMeta` when building with Webpack.

**.babelrc**:

```json
{
  "plugins": ["@creuna/prop-types-csharp/babel-plugin"]
}
```

## <a id="eslint"></a>Eslint plugin

This package includes an `eslint` plugin. Because `eslint` requires all plugins to be published separately to `npm` with a name startig with `eslint-plugin-`, we've published the proxy package [@creuna/eslint-plugin-prop-types-csharp](https://www.npmjs.com/package/@creuna/eslint-plugin-prop-types-csharp). The proxy package imports the actual plugin code from this package so that it can be used with `eslint`.

```
yarn add @creuna/eslint-plugin-prop-types-csharp
```

Even though the plugin checks many different things in your source code, the plugin only has one rule: `all`. The reason for this is that it wouldn't really make sense to have control over individual rules, because breaking any of them would also make the class generation fail, so you'll want to have all checks enabled.

.eslintrc.json:

```json
{
  "plugins": ["@creuna/eslint-plugin-prop-types-csharp"],
  "rules": {
    "@creuna/prop-types-csharp/all": 2
  }
}
```
