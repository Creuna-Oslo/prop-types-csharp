// const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const createNewDefinitions = require('../utils/create-new-definitions');
const generateCSharp = require('../utils/generate-csharp');
const getComponentName = require('../utils/get-component-name');
const getPropTypes = require('../utils/get-prop-types');
const stripValidateSimplify = require('../utils/strip-validate-simplify');

module.exports = function({ requirePropTypes, sourceCode }) {
  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName(syntaxTree);

  const { propTypesAST, propTypesIdentifierName, propTypesMeta } = getPropTypes(
    {
      componentName,
      requirePropTypes,
      syntaxTree
    }
  );

  // Replace Syntax tree representing the component with a tree only representing the propTypes. Sadly, I found no way of doing this without mutating the exising tree because generating a new program node will require a parentPath and a scope and who knows what they are.
  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypesAST]));
      path.stop();
    }
  });

  // Strip client-only types, apply meta types and simplify type definitions
  stripValidateSimplify({ propTypesIdentifierName, propTypesMeta, syntaxTree });

  // Create new type nodes in the program for props of type 'shape', 'oneOf'
  createNewDefinitions({ syntaxTree });

  // At this point, the syntax tree has been transformed into something that would look like this:

  // Component = {
  //   text: string.isRequired,
  //   texts: arrayOf(string),
  //   singleObject: SingleObject,
  //   objects: arrayOf(ObjectsItem).isRequired,
  //   enumArray: EnumArray,
  // };
  // SingleObject = {
  //   propertyA: string.isRequired
  // };
  // ObjectsItem = {
  //   propertyB: string
  // };
  // EnumArray = ['value-1', 'value-2'];

  return { componentName, code: generateCSharp({ syntaxTree }) };
};
