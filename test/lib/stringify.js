const test = require('ava');

const stringify = require('../../lib/stringify');
const normalize = require('../utils/_normalize-string');

const basicDefinitions = [
  {
    name: 'Component',
    parent: { name: 'Component' },
    properties: {
      type: 'shape',
      isComponentClass: true,
      argument: {
        text: { type: 'string', isRequired: true },
        texts: {
          type: 'arrayOf',
          argument: {
            type: 'arrayOf',
            argument: { type: 'arrayOf', argument: { type: 'string' } }
          }
        },
        singleObject: { type: 'singleObject', hasClassDefinition: true },
        objects: {
          type: 'arrayOf',
          isRequired: true,
          argument: { type: 'objectsItem', hasClassDefinition: true }
        }
      }
    }
  },
  {
    name: 'singleObject',
    parent: { name: 'Component' },
    properties: {
      type: 'shape',
      argument: {
        propertyA: { type: 'string', isRequired: true }
      }
    }
  },
  {
    name: 'objectsItem',
    parent: { name: 'Component' },
    properties: {
      type: 'shape',
      argument: { propertyB: { type: 'string' } }
    }
  }
];

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
    normalize(expected, removeIndentation),
    normalize(
      stringify(Object.assign({}, options, { definitions: input })),
      removeIndentation
    )
  );
};

test('Basic propTypes', template, basicDefinitions, imports + basicClass);

test(
  'With namespace',
  template,
  basicDefinitions,
  `${imports}\n` + `namespace Something.SomethingElse\n{\n${basicClass}\n}`,
  { namespace: 'Something.SomethingElse' }
);

test(
  'With base class',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: { type: 'shape', argument: {}, isComponentClass: true }
    }
  ],
  imports +
    `public class Component : BaseClass
  {
  }`,
  { baseClass: 'BaseClass', componentName: 'Component' }
);

// Base class should only be applied to the class where 'isComponentClass' === true
test(
  'Nested properties with base class',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: { type: 'shape', argument: {}, isComponentClass: true }
    },
    {
      name: 'ComponentProperty',
      parent: { name: 'Component' },
      properties: { type: 'shape', argument: {} }
    }
  ],
  imports +
    `public class Component : BaseClass
    {
    }
    public class Component_ComponentProperty
    {
    }`,
  { baseClass: 'BaseClass', componentName: 'Component' }
);

test(
  'With name collision between class name and base class',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: { type: 'shape', argument: {}, isComponentClass: true }
    }
  ],
  imports +
    `public class Component
  {
  }`,
  { baseClass: 'Component' }
);

test(
  'With different indentation',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: { a: { type: 'string' } },
        isComponentClass: true
      }
    }
  ],
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
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: {
          enum: { type: 'enum', hasClassDefinition: true }
        },
        isComponentClass: true
      }
    },
    {
      name: 'enum',
      parent: { name: 'Component' },
      properties: { type: 'oneOf', argument: ['value-1', 'value-2'] }
    }
  ],
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
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: {
          enum: { type: 'enum', isRequired: true, hasClassDefinition: true }
        },
        isComponentClass: true
      }
    },
    {
      name: 'enum',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        isRequired: true,
        argument: ['value-1', 'value-2']
      }
    }
  ],
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
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: {
          enum: { type: 'enum', hasClassDefinition: true }
        },
        isComponentClass: true
      }
    },
    {
      name: 'enum',
      parent: { name: 'Component' },
      properties: {
        type: 'oneOf',
        argument: ['-value-1', '.value-2', '#value-3']
      }
    }
  ],
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
  'Empty definition',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        argument: {
          property: { type: 'property', hasClassDefinition: true }
        },
        isComponentClass: true
      }
    },
    {
      name: 'property',
      parent: { name: 'Component' },
      properties: { type: 'shape', argument: {} }
    }
  ],
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
  { componentName: 'Component' },
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
  { componentName: 'Component', namespace: 'Namespace' },
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
  { componentName: 'Component', baseClass: 'BaseClass' },
  false
);

// To make sure no shenanigans happen when props are called 'type'
test(
  'Prop named "type"',
  template,
  [
    {
      name: 'Component',
      parent: { name: 'Component' },
      properties: {
        type: 'shape',
        isComponentClass: true,
        argument: {
          type: { type: 'string' }
        }
      }
    }
  ],
  imports +
    `
public class Component
{
  public string Type { get; set; }
}`,
  { componentName: 'Component' }
);
