const assert = require('assert');
const { parse } = require('@babel/parser');
const t = require('@babel/types');

const expandReferences = require('./expand-references');
const getComponentName = require('../common/get-component-name');
const getMeta = require('../common/get-meta');
const getPropTypes = require('./get-prop-types');
const getPropTypesIdentifierName = require('./get-prop-types-identifier-name');
const metaTypes = require('../../meta-types');
const parseAST = require('./parse-ast');
const stripPropTypesIdentifier = require('./strip-prop-types-identifier');

module.exports = function(sourceCode) {
  assert(sourceCode, 'No source code provided');

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { propTypesMeta } = getMeta({ syntaxTree });

  if (propTypesMeta === metaTypes.exclude) {
    return {};
  }

  const { componentName } = getComponentName({ syntaxTree });
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

  return {
    className: componentName,
    propTypes: parseAST(propTypesAST, propTypesMeta),
    propTypesMeta
  };
};
