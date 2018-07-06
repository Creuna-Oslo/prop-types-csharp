// const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const createNewDefinitions = require('./create-new-definitions');
const expandReferences = require('./expand-references');
const generateCSharp = require('../utils/generate-csharp');
const getComponentName = require('../utils/get-component-name');
const getMeta = require('../utils/get-meta');
const getPropTypes = require('../utils/get-prop-types');
const getPropTypesIdentifierName = require('../utils/get-prop-types-identifier-name');
const stripValidateSimplify = require('./strip-validate-simplify');

module.exports = function({ sourceCode }) {
  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName({ syntaxTree });
  const { propTypesMeta } = getMeta({ syntaxTree });

  const { propTypesIdentifierName } = getPropTypesIdentifierName({
    syntaxTree
  });

  // Strip client-only types, apply meta types and simplify type definitions
  stripValidateSimplify({ propTypesIdentifierName, propTypesMeta, syntaxTree });

  // Expand references to arrays and objects in 'oneOf'
  expandReferences({ componentName, syntaxTree });

  const { propTypesAST } = getPropTypes({
    componentName,
    syntaxTree
  });

  // getPropTypes returns an Expression node, which contains an AssignmentExpression node, which has a 'right' property which is where the propType definitions live. If the 'right' property is not an ObjectExpression node, something other than an object literal has been assigned to the component propType definition. In that case, don't generate a class
  if (!t.isObjectExpression(propTypesAST.expression.right)) {
    return {};
  }

  // Replace Syntax tree representing the component with a tree only representing the propTypes. Sadly, I found no way of doing this without mutating the exising tree because generating a new program node will require a parentPath and a scope and who knows what they are.
  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypesAST]));
      path.stop();
    }
  });

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

  // Stringify!
  const code = generateCSharp({ syntaxTree });

  return { componentName, code };
};
