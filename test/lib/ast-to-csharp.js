const { parse } = require('@babel/parser');
const test = require('ava');

const ASTToCsharp = require('../../lib/utils/ast-to-csharp');
const normalize = require('../utils/_normalize-string');

const basicTree = `
  Component = {
    text: string.isRequired,
    texts: [[[string]]],
    singleObject: Component_SingleObject,
    objects: [Component_ObjectsItem].isRequired
  };
  Component_SingleObject = {
    propertyA: string.isRequired
  };
  Component_ObjectsItem = {
    propertyB: string
  };
`;

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
  public IList<Component_ObjectsItem> Objects { get; set; }
}
public class Component_SingleObject
{
  [Required]
  public string PropertyA { get; set; }
}
public class Component_ObjectsItem
{
  public string PropertyB { get; set; }
}
`;

const template = (t, input, expected, options, removeIndentation) => {
  t.is(
    normalize(
      ASTToCsharp(Object.assign({}, options, { syntaxTree: parse(input) })),
      removeIndentation
    ),
    normalize(expected, removeIndentation)
  );
};

test('Basic tree', template, basicTree, imports + basicClass);

test(
  'With namespace',
  template,
  basicTree,
  `${imports}\n` + `namespace Something.SomethingElse\n{\n${basicClass}\n}`,
  { namespace: 'Something.SomethingElse' }
);

test(
  'With base class',
  template,
  `Component = {};`,
  imports +
    `public class Component : BaseClass
  {
  }`,
  { baseClass: 'BaseClass' }
);

test(
  'With name collision between class name and base class',
  template,
  `Component = {};`,
  imports +
    `public class Component
  {
  }`,
  { baseClass: 'Component' }
);

test(
  'With different indentation',
  template,
  `Component = { a: string };`,
  imports +
    `
public class Component
{
      public string A { get; set; }
}
  `,
  { indent: 6 },
  false
);

test(
  'Optional enum',
  template,
  `Component = {
    enum: Enum
  };
  Enum = ['value-1', 'value-2'];
  `,

  imports +
    `public class Component
    {
      public Enum Enum { get; set; }
    }
    public enum Enum
    {
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
  `Component = {
      enum: Enum.isRequired
    };
    Enum = ['value-1', 'value-2'];
  `,
  imports +
    `public class Component
      {
        [Required]
        public Enum Enum { get; set; }
      }
      public enum Enum
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
  `Component = {
      enum: Enum
    };
    Enum = ['-value-1', '.value-2', '#value-3'];
  `,
  imports +
    `public class Component
      {
        public Enum Enum { get; set; }
      }
      public enum Enum
      {
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
  'With empty definition',
  template,
  `Component = {
    property: Property
  };
  Property = {};`,
  imports +
    `public class Component
    {
      public Property Property { get; set; }
    }
    public class Property
    {
    }`
);

test('Throws on function call', t => {
  t.throws(() => {
    ASTToCsharp({
      syntaxTree: parse(`
        Component = {
          prop: arrayOf()
        }
      `)
    });
  });
});
