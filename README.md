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
import Link from "components/link";

Component.propTypes = {
  text: PropTypes.string.isRequired,
  isSomething: PropTypes.bool,
  intNumber: PropTypes.number,
  floatNumber: PropTypes.number,
  texts: PropTypes.arrayOf(PropTypes.string),
  singleObject: PropTypes.shape({
    propertyA: PropTypes.string.isRequired
  }),
  objects: PropTypes.arrayOf(
    PropTypes.shape({
      propertyB: PropTypes.string
    })
  ).isRequired,
  externalType: Link.propTypes,
  externalTypeList: PropTypes.arrayOf(Link.propTypes),

  // These should be excluded
  instance: PropTypes.instanceOf(Link),
  excludeMe: PropTypes.number,
  node: PropTypes.node,
  element: PropTypes.element,
  function: PropTypes.func
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
public class Component
{
  [Required]
  public string { get; set; }
  public bool IsSomething { get; set; }
  public int IntNumber { get; set; }
  public float FloatNumber { get; set; }
  public string[] Texts { get; set; }
  public SingleObject SingleObject { get; set; }
  [Required]
  public undefined { get; set; } /* Needs fix. Broken because of isRequired */
  public Link ExternalType { get; set; }
  public Link[] ExternalTypeList { get; set; }
}

public class SingleObject
{
  [Required]
  public string { get; set; }
}

public class ObjectsItem
{
  public string PropertyB { get; set; }
}
```
