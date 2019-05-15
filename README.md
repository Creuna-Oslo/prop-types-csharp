# PropTypes to C# class generator

[![npm version](https://img.shields.io/npm/v/@creuna/prop-types-csharp.svg)](https://npmjs.com/package/@creuna/prop-types-csharp)
[![Travis status](https://travis-ci.org/Creuna-Oslo/prop-types-csharp.svg?branch=master)](https://travis-ci.org/Creuna-Oslo/prop-types-csharp)
[![Coverage Status](https://coveralls.io/repos/github/Creuna-Oslo/prop-types-csharp/badge.svg?branch=master)](https://coveralls.io/github/Creuna-Oslo/prop-types-csharp?branch=master)

This package has tools for generating C# classes from React components using propTypes. Supports javascript and typescript.

## Table of contents

- [General concepts](#general)
- [Typescript](#typescript)
- [About generated classes](#classes)
- [Node.js API](#node)
- [Webpack plugin](#webpack)
- [Babel plugin](#babel)
- [eslint plugin](#eslint)

## Install

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

### propTypesMeta (`String | Object`)

#### `String`

The only supported string value for `propTypesmeta` is `'exclude'`. When `Component.propTypesMeta = 'exclude';`, no class will be generated for the component.

#### `Object`

In general, it's recommended to define as much as possible in `propTypes`. In some cases however, that might be difficult, and in those cases `propTypesMeta` can be helpful.

`propTypesMeta` can be used to exclude some props from C# classes or to provide type hints for ambiguous types.

Supported values for props in `propTypesMeta` are

- `"int"`
- `"int?"`
- `"float"`
- `"float?"`
- `"double"`
- `"double?"`
- `"exclude"`
- React component
- `(< React component > | Object)[]`

`"int"`, `"float"`, `"double"` and their nullable counterparts replace `PropTypes.number` if supplied. By default, `PropTypes.number` will result in `int` in C# classes.

Functional component:

```jsx
const Component = () => <div />;

Component.propTypes = {
  someProp: PropTypes.number,
  anotherProp: PropTypes.string,
  someComponent: PropTypes.object,
  items: PropTypes.array,
  numbers: PropTypes.arrayOf(
    PropTypes.shape({
      number: PropTypes.number
    })
  )
};

Component.propTypesMeta = {
  someProp: "float",
  anotherProp: "exclude",
  someComponent: SomeComponent,
  items: [AnotherComponent],
  numbers: [{ number: "float" }]
};
```

Class component:

```jsx
class Component extends React.Component {
  static propTypes = {
    someProp: PropTypes.number,
    anotherProp: PropTypes.string,
    someComponent: PropTypes.object,
    items: PropTypes.array,
    numbers: PropTypes.arrayOf(
      PropTypes.shape({
        number: PropTypes.number
      })
    )
  };

  static propTypesMeta = {
    someProp: "float",
    anotherProp: "exclude",
    someComponent: SomeComponent,
    items: [AnotherComponent],
    numbers: [{ number "float" }]
  };
}
```

### Inheritance

Inheritance of propTypes from other components is supported and will result in C# classes with corresponding inheritance. The `baseClass` option will be overridden when inheriting.

Simple:

```js
MyComponent.propTypes = OtherComponent.propTypes;
```

With properties:

```js
// Remember to not mutate other components' propTypes!
MyComponent.propTypes = Object.assign({}, OtherComponent.propTypes, {
  foo: PropTypes.string,
  bar: PropTypes.number
});
```

Referencing a single property:

```js
MyComponent.propTypes: {
  items: OtherComponent.propTypes.items
};
```

## <a id="typescript"></a> Typescript

The class generator will determine the name of the generated class based on how prop types are defined:

- the component name if a type literal is used
- the name of the interface/type alias if used

If type parameters are used the generator will attempt to use the first parameter as the type definition for the component. Keep in mind that using something other than the prop types as the first argument, class generation might succeed but the generated class will not have the right properties.

### Illegal types

As with the javascript parser, some types are not allowed because they cannot be easily converted to C#, like `object`, `any`, intersection and union types.

```tsx
const A = (props: { b: string }) => null; // Class name: A
const A: React.FunctionComponent<{ b: string }> = props => null; // Class name: A

type BProps = { c: string };
const B = (props: BProps) => null; // Class name: BProps
const B: React.FunctionComponent<BProps> = props => null; // Class name: BProps

const CProps = { d: string };
const C: SomeType<any, CProps> = props => null; // Error.
```

### PropTypesMeta

`propTypesMeta` works in mostly the same way as for javascript components, the only notable expection being the lack of support for referencing other components.

Two type aliases are exported that can be used to validate `propTypesMeta`:

```tsx
import {
  PropTypesMeta,
  WithPropTypesMeta
} from "@prop-types-csharp/prop-types-meta";

type AProps = { a: string; b: number };
class A extends React.Component<AProps> {
  static propTypesMeta: PropTypesMeta<AProps> = {
    a: "exclude",
    b: "int?"
  };
}

type BProps = { a: string; b: number };
const B: WithPropTypesMeta<BProps> = props => null;
B.propTypesMeta = { a: "exclude", b: "int?" };
```

`WithPropTypesMeta` accepts a second type parameter that can be used if stuff like `React.FunctionComponent` is needed. Usage is quite verbose so adding your own type alias might be useful.

```tsx
type BProps = { a: string; b: number };
const B: WithPropTypesMeta<BProps, React.FunctionComponent<BProps>> = props =>
  null;
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

The Node API exports an object:

```ts
{
  generate: function(sourceCode, options){} // Generates a class string,
  parsers: {
    javascript: function(){},
    typescript: function(){}
  }
}
```

### generate(_sourceCode, options_)

#### Returns

Returns an `object` containing:

**className**: `String`
Name of React component (derived from export declaration).

**code**: `String`
Source code for new C# class.

#### sourceCode: _String_

Source code of a React component as string.

#### <a id="compiler-options"></a>options: _Object_

**baseClass**: `String`

Base class that generated classes will extend

**generator**: `Function` = `lib/stringify/lang/csharp`

Use this if you want to generate something other than C#. The function is passed `definitions` (a list of objects describing classes to generate), `className` (the name of the class to generate) and an options object. It is expected to return a `string`. The easiest way of adding a new language is probably to clone `lib/stringify/lang/csharp` and work from there. If you do make a generator for another language, please consider submitting a PR!

**indent**: `Number` = `2`

Number of spaces of indentation in generated C# file

**instantiateProperties**: `Boolean` = `false`

Whether class properties should be instantiated or not. Does not apply to basic types like `string`, `int` or `bool`.

**namespace**: `String`

Namespace to wrap around generated C# class

**parser**: `Function` = javascript parser

What input language to parse. Javascript and typescript parsers are exported from the main library.

### Example

```js
const { generate } = require("@creuna/prop-types-csharp");

const { className, code } = generate(sourceCode, {
  indent: 4,
  namespace: "Some.Awesome.Namespace"
});
```

### Typescript example

```js
const { generate, parsers } = require("@creuna/prop-types-csharp");

const { className, code } = generate(sourceCode, {
  parser: parsers.typescript
});
```

## <a id="webpack"></a>Webpack plugin

The plugin will extract PropType definitions from `.jsx` files (configurable) and convert them into C# class files. If the build already has errors when this plugin runs, it aborts immediately.

### Config example

```js
const PropTypesCSharpPlugin = require('@creuna/prop-types-csharp/webpack-plugin');
const { parsers } = require('@creua/prop-types-csharp');

module.exports = function(env, options = {}) {
  return {
    entry: { ... },
    output: { ... },
    module: { ... },
    plugins: [
      new PropTypesCSharpPlugin({
        exclude: ['node_modules', 'some/path/to/exclude'],
        compilerOptions: {
          parser: parsers.typescript
        }
      })
    ]
  };
};
```

### Options: `Object`

**async**: `Boolean` = `false`

It's recommended to set this to true when running with webpack dev server for these reasons:

- The build can finish before class generation is done, meaning faster hot reloading of the browser.
- Classes are written to disk by the plugin (Webpack dev server only writes to memory). Handy if you have generated classes in version control and don't want to do a production build before each commit.

**exclude**: `Array` of `String | RegExp` = `['node-modules']`

A file is excluded if its path matches any of the exclude patterns. Default is replaced when setting this.

**compilerOptions**: `Object`

Options passed to the compiler, such as input language and formatting choices. Supported options are listed in the [Node.js API options](#compiler-options)

**log**: `Boolean` = `false`

If set to true, will output some meta information from the plugin.

**match**: `Array` of `String | RegExp` = `[/\.jsx$/]`

A file is included if its path matches any of the matching patterns (unless it matches an exclude pattern). Default is replaced when setting this.

**path**: `String`

Path relative to `output.path` to put `.cs` files.

## <a id="babel"></a>Babel plugin

Having a bunch of `propTypesMeta` scattered all around your production code might not be what you want. To solve this issue, a Babel plugin is included which, if enabled, will strip all instances of `ComponentName.propTypesMeta` or `static propTypesMeta` when building with Webpack.

**IMPORTANT**

`@creuna/prop-types-csharp/babel-plugin` needs to be the first plugin to run on your code. If other plugins have transformed the code first, we can't guarantee that it will work like expected.

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
