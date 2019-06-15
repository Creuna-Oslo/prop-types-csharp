const test = require('ava');

const stringify = require('../../../lib/stringify/lang/csharp');
const normalize = require('../../utils/_normalize-string');

const basicDefinition = {
  text: { type: 'string', isRequired: true },
  texts: {
    type: 'arrayOf',
    children: {
      type: 'arrayOf',
      children: { type: 'arrayOf', children: { type: 'string' } }
    }
  },
  singleObject: {
    type: 'shape',
    children: {
      propertyA: { type: 'string', isRequired: true }
    }
  },
  objects: {
    type: 'arrayOf',
    isRequired: true,
    children: {
      type: 'shape',
      children: { propertyB: { type: 'string' } }
    }
  }
};

const imports = `using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;\n`;

const basicClass = `
public class Component
{
  [Required]
  public string Text { get; set; }
  public IList<IList<IList<string>>> Texts { get; set; }
  public Component_SingleObject SingleObject { get; set; }
  [Required]
  public IList<Component_Objects> Objects { get; set; }
}
public class Component_SingleObject
{
  [Required]
  public string PropertyA { get; set; }
}
public class Component_Objects
{
  public string PropertyB { get; set; }
}
`;

const template = (
  t,
  input,
  expected,
  options,
  className = 'Component',
  removeIndentation
) => {
  t.is(
    normalize(expected, removeIndentation),
    normalize(stringify(input, className, options), removeIndentation)
  );
};

test('Basic propTypes', template, basicDefinition, imports + basicClass);

test(
  'With namespace',
  template,
  basicDefinition,
  `${imports}\n` + `namespace Something.SomethingElse\n{\n${basicClass}\n}`,
  { namespace: 'Something.SomethingElse' }
);

test(
  'With base class',
  template,
  {},
  imports +
    `public class Component : BaseClass
  {
  }`,
  { baseClass: 'BaseClass', className: 'Component' }
);

// Base class should only be applied to the class that doesn't have 'parents'
test(
  'Nested properties with base class',
  template,
  {
    componentProperty: {
      type: 'shape',
      children: {}
    }
  },
  imports +
    `public class Component : BaseClass
    {
      public Component_ComponentProperty ComponentProperty { get; set; }
    }
    public class Component_ComponentProperty
    {
    }`,
  { baseClass: 'BaseClass', className: 'Component' }
);

test(
  'With name collision between class name and base class',
  template,
  {},
  imports +
    `public class Component
  {
  }`,
  { baseClass: 'Component' }
);

test(
  'With different indentation',
  template,
  { a: { type: 'string' } },
  imports +
    `
public class Component
{
      public string A { get; set; }
}
  `,
  { indent: 6 },
  'Component',
  false
);

test(
  'Optional enum',
  template,
  {
    enum: {
      type: 'oneOf',
      parents: ['Component'],
      children: ['value-1', 'value-2']
    }
  },
  imports +
    `public class Component
    {
      public Component_Enum Enum { get; set; }
    }
    public enum Component_Enum
    {
      [EnumMember(Value = "")]
      None = 0,
      [EnumMember(Value = "value-1")]
      Value1 = 1,
      [EnumMember(Value = "value-2")]
      Value2 = 2,
    }`
);

test(
  'Required enum',
  template,
  {
    enum: {
      type: 'oneOf',
      isRequired: true,
      parents: ['Component'],
      children: ['value-1', 'value-2']
    }
  },
  imports +
    `public class Component
      {
        [Required]
        public Component_Enum Enum { get; set; }
      }
      public enum Component_Enum
      {
        [EnumMember(Value = "value-1")]
        Value1 = 0,
        [EnumMember(Value = "value-2")]
        Value2 = 1,
      }
    `
);

test(
  'Enum with name starting with non-letter',
  template,
  {
    enum: {
      type: 'oneOf',
      children: ['-value-1', '.value-2', '#value-3']
    }
  },
  imports +
    `public class Component
      {
        public Component_Enum Enum { get; set; }
      }
      public enum Component_Enum
      {
        [EnumMember(Value = "")]
        None = 0,
        [EnumMember(Value = "-value-1")]
        Value1 = 1,
        [EnumMember(Value = ".value-2")]
        Value2 = 2,
        [EnumMember(Value = "#value-3")]
        Value3 = 3,
      }
    `
);

test(
  'Enum from Object.values',
  template,
  {
    a: {
      type: 'oneOf',
      children: [{ key: 'a', value: 'b' }]
    }
  },
  imports +
    `public class Component
    {
      public Component_A A { get; set; }
    }
    public enum Component_A
    {
      [EnumMember(Value = "")]
      None = 0,
      [EnumMember(Value = "b")]
      A = 1,
    }`
);

test(
  'Empty definition',
  template,
  {
    property: {
      type: 'shape',
      children: {}
    }
  },
  imports +
    `public class Component
    {
      public Component_Property Property { get; set; }
    }
    public class Component_Property
    {
    }`
);

test(
  'Component reference',
  template,
  'AnotherComponent',
  imports +
    `
public class Component : AnotherComponent
{
}`,
  {},
  'Component',
  false
);

test(
  'Component reference with namespace',
  template,
  'AnotherComponent',
  imports +
    `
namespace Namespace
{
  public class Component : AnotherComponent
  {
  }
}`,
  { namespace: 'Namespace' },
  'Component',
  false
);

test(
  'Component reference with base class',
  template,
  'AnotherComponent',
  imports +
    `
public class Component : AnotherComponent
{
}`,
  { baseClass: 'BaseClass' },
  'Component',
  false
);

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  { type: { type: 'string' } },
  imports +
    `
public class Component
{
  public string Type { get; set; }
}`,
  { className: 'Component' }
);
