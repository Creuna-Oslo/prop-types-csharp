const assert = require('assert');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const expandReferences = require('./expand-references');
const getComponentName = require('../common/get-component-name');
const getMeta = require('./get-meta');
const getPropTypes = require('./get-prop-types');
const getPropTypesIdentifierName = require('./get-prop-types-identifier-name');
const parseAST = require('./parse-ast');
const stripPropTypesIdentifier = require('./strip-prop-types-identifier');

module.exports = function(sourceCode) {
  assert(sourceCode, 'No source code provided');

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName({ syntaxTree });
  const { propTypesMeta } = getMeta({ syntaxTree });

  if (propTypesMeta === 'exclude') {
    return {};
  }

  const { propTypesIdentifierName } = getPropTypesIdentifierName({
    syntaxTree
  });

  stripPropTypesIdentifier({ propTypesIdentifierName, syntaxTree });

  // Expand references to arrays and objects in 'oneOf'
  expandReferences({ componentName, propTypesMeta, syntaxTree });

  // Extract the propTypes part of the syntax tree
  const { propTypesAST } = getPropTypes({
    componentName,
    syntaxTree
  });

  // getPropTypes returns an Expression node, which contains an AssignmentExpression node, which has a 'right' property which is where the propType definitions live. The only legal values for the 'right' node is an ObjectExpression (object literal) or a MemberExpression that looks like this: 'SomeComponent.propTypes'.
  const propTypesValue = propTypesAST.expression.right;

  if (
    !t.isObjectExpression(propTypesValue) &&
    !t.isMemberExpression(propTypesValue)
  ) {
    return {};
  }

  // Exit if the propTypes definition is a MemberExpression but is not a reference to another component's propTypes.
  if (
    t.isMemberExpression(propTypesValue) &&
    !t.isIdentifier(propTypesValue.property, { name: 'propTypes' })
  ) {
    return {};
  }

  // Replace Syntax tree representing the component with a tree only representing the propTypes. Sadly, I found no way of doing this without mutating the exising tree because generating a new program node will require a parentPath and a scope and who knows what they are.
  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypesAST]));
      path.stop();
    }
  });

  return {
    className: componentName,
    propTypes: parseAST(syntaxTree, propTypesMeta),
    propTypesMeta
  };
};
