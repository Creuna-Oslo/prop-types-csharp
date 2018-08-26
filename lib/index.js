// const generate = require('@babel/generator').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const ASTToCsharp = require('./utils/ast-to-csharp');
const createNewDefinitions = require('./transforms/create-new-definitions');
const expandReferences = require('./transforms/expand-references');
const getComponentName = require('./utils/get-component-name');
const getMeta = require('./utils/get-meta');
const getPropTypes = require('./utils/get-prop-types');
const getPropTypesIdentifierName = require('./utils/get-prop-types-identifier-name');
const stripPropTypesIdentifier = require('./utils/strip-prop-types-identifier');
const transformPropTypes = require('./transforms/transform-prop-types');
const validateProps = require('./utils/validate-props');

module.exports = function({ indent, namespace, sourceCode }) {
  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName({ syntaxTree });
  const { propTypesMeta } = getMeta({ syntaxTree });

  const { propTypesIdentifierName } = getPropTypesIdentifierName({
    syntaxTree
  });

  // Abort if file doesn't import 'prop-types'
  if (!propTypesIdentifierName) {
    return {};
  }

  stripPropTypesIdentifier({ propTypesIdentifierName, syntaxTree });

  // Expand references to arrays and objects in 'oneOf'
  expandReferences({ componentName, syntaxTree });

  // Extract the propTypes part of the syntax tree
  const { propTypesAST } = getPropTypes({
    componentName,
    syntaxTree
  });

  // getPropTypes returns an Expression node, which contains an AssignmentExpression node, which has a 'right' property which is where the propType definitions live. If the 'right' property is not an ObjectExpression node, something other than an object literal has been assigned to the component propType definition. In that case, don't generate a class
  if (!t.isObjectExpression(propTypesAST.expression.right)) {
    return {};
  }

  validateProps({ propTypesAST });

  // Replace Syntax tree representing the component with a tree only representing the propTypes. Sadly, I found no way of doing this without mutating the exising tree because generating a new program node will require a parentPath and a scope and who knows what they are.
  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypesAST]));
      path.stop();
    }
  });

  // Strip client-only types, apply meta types and strip 'PropTypes' prefix from types
  transformPropTypes({ propTypesMeta, syntaxTree });

  // Create new nodes in the Program node for props of type 'shape' and 'oneOf'. These will be used to create new classes in the same .cs-file as the component class.
  createNewDefinitions({ syntaxTree });

  // At this point, the syntax tree has been transformed into something that would look like this:

  // Component = {
  //   text: string.isRequired,
  //   texts: [string],
  //   singleObject: SingleObject,
  //   objects: [ObjectsItem].isRequired,
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
  const code = ASTToCsharp({ indent, namespace, syntaxTree });

  return { componentName, code };
};
