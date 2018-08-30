const { parse } = require('@babel/parser');
const test = require('ava');

const ASTToCsharp = require('../../lib/utils/ast-to-csharp');
const normalize = require('../utils/_normalize-string');

const basicTree = parse(`
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
`);

const imports = `using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;`;

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

test('Basic tree', t => {
  t.is(
    normalize(ASTToCsharp({ syntaxTree: basicTree })),
    normalize(imports + basicClass)
  );
});

test('With namespace', t => {
  t.is(
    normalize(
      ASTToCsharp({
        namespace: 'Something.SomethingElse',
        syntaxTree: basicTree
      })
    ),
    normalize(
      `${imports}\n` + `namespace Something.SomethingElse\n{\n${basicClass}\n}`
    )
  );
});

test('With base class', t => {
  t.is(
    normalize(
      ASTToCsharp({
        baseClass: 'BaseClass',
        syntaxTree: parse(`
        Component = {};
        `)
      })
    ),
    normalize(
      `${imports}\n` +
        `
public class Component : BaseClass
{
}
      `
    )
  );
});

test('With different indentation', t => {
  const ast = parse(`
    Component = {
      a: string
    };
  `);
  const classString =
    imports +
    `
public class Component
{
      public string A { get; set; }
}
  `;

  t.is(
    normalize(
      ASTToCsharp({
        indent: 6,
        syntaxTree: ast
      }),
      false
    ),
    normalize(classString, false)
  );
});

test('Optional enum', t => {
  const code = `
    Component = {
      enum: Enum
    };
    Enum = ['value-1', 'value-2'];
  `;

  t.is(
    normalize(
      ASTToCsharp({
        syntaxTree: parse(code)
      })
    ),
    normalize(
      imports +
        `
      public class Component
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
      }
    `
    )
  );
});

test('Required enum', t => {
  const code = `
    Component = {
      enum: Enum.isRequired
    };
    Enum = ['value-1', 'value-2'];
  `;

  t.is(
    normalize(
      ASTToCsharp({
        syntaxTree: parse(code)
      })
    ),
    normalize(
      imports +
        `
      public class Component
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
    )
  );
});

test('Enum with name starting with non-letter', t => {
  const code = `
    Component = {
      enum: Enum
    };
    Enum = ['-value-1', '.value-2', '#value-3'];
  `;

  t.is(
    normalize(
      ASTToCsharp({
        syntaxTree: parse(code)
      })
    ),
    normalize(
      imports +
        `
      public class Component
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
    )
  );
});

test('With empty definition', t => {
  t.is(
    normalize(
      ASTToCsharp({
        syntaxTree: parse(`
        Component = {
          property: Property
        };
        Property = {};
      `)
      })
    ),
    normalize(
      imports +
        `
        public class Component
        {
          public Property Property { get; set; }
        }
        public class Property
        {
        }
      `
    )
  );
});

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
