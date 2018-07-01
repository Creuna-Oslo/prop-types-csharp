# csharp-class-generator

Generate C# classes from React component propTypes

This is a work in progress!

## How to run it

```
yarn
```

```
node debug/transform-prop-types.js
```

## Status

Currently, the transform script turns this:

```jsx
import pt from "prop-types";

import Link from "components/link";

const enumArray = ["value-1", "value-2"];
const enumObject = {
  valueA: "value-a",
  valueB: "value-b"
};

const Component = props => <div>{props.text}</div>;

Component.propTypes = {
  text: pt.string.isRequired,
  isSomething: pt.bool,
  intNumber: pt.number,
  floatNumber: pt.number,
  texts: pt.arrayOf(pt.string),
  singleObject: pt.shape({
    propertyA: pt.string.isRequired
  }),
  objects: pt.arrayOf(
    pt.shape({
      propertyB: pt.string
    })
  ).isRequired,
  externalType: pt.shape(Link.propTypes),
  externalTypeList: pt.arrayOf(pt.shape(Link.propTypes)),
  enumArray: pt.oneOf(enumArray).isRequired,
  enumInline: pt.oneOf([1, 2]),
  enumObject: pt.oneOf(Object.keys(enumObject)),

  // These should be excluded
  instance: pt.instanceOf(Link),
  excludeMe: pt.number,
  node: pt.node,
  element: pt.element,
  function: pt.func
};

Component.propTypesMeta = {
  intNumber: "int",
  floatNumber: "float",
  excludeMe: "exclude"
};
```

into this:

```cs
public class Component
{
  [Required]
  public string Text { get; set; }
  public bool IsSomething { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public string[] Texts { get; set; }
  public SingleObject SingleObject { get; set; }
  [Required]
  public ObjectsItem[] Objects { get; set; }
  public Link ExternalType { get; set; }
  public Link[] ExternalTypeList { get; set; }
  [Required]
  public EnumArray EnumArray { get; set; }
  public EnumInline EnumInline { get; set; }
  public EnumObject EnumObject { get; set; }
}

public class SingleObject
{
  [Required]
  public string PropertyA { get; set; }
}

public class ObjectsItem
{
  public string PropertyB { get; set; }
}

public enum EnumArray
{
  [StringValue("value-1")] Value1 = 0,
  [StringValue("value-2")] Value2 = 1,
}

public enum EnumInline
{
 EnumInline1 = 1,
 EnumInline2 = 2,
}

public enum EnumObject
{
  [StringValue("valueA")] ValueA = 0,
  [StringValue("valueB")] ValueB = 1,
}
```
