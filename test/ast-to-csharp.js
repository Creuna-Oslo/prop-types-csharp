const { parse } = require('@babel/parser');
const test = require('ava');

const ASTToCsharp = require('../source/utils/ast-to-csharp');

test('Valid tree', t => {
  t.snapshot(
    ASTToCsharp({
      syntaxTree: parse(`
        Component = {
          text: string.isRequired,
          texts: arrayOf(string),
          singleObject: SingleObject,
          objects: arrayOf(ObjectsItem).isRequired,
          enumArray: EnumArray,
        };
        SingleObject = {
          propertyA: string.isRequired
        };
        ObjectsItem = {
          propertyB: string
        };
        EnumArray = ['value-1', 'value-2'];
      `)
    })
  );
});

// Only valid function call is 'arrayOf'
test('Throws on invalid function call', t => {
  t.throws(() => {
    ASTToCsharp({
      syntaxTree: parse(`
        Component = {
          prop: shape(string)
        }
      `)
    });
  });
});

test('Throws on bad component reference in arrayOf', t => {
  t.throws(() => {
    ASTToCsharp({
      syntaxTree: parse(`
        Component = {
          prop: arrayOf(AnotherComponent.propTypes)
        }
      `)
    });
  });
});
