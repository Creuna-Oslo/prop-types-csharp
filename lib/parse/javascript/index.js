const assert = require('assert');
const { parse } = require('@babel/parser');
const t = require('@babel/types');

const expandReferences = require('./expand-references');
const getComponentName = require('../common/get-component-name');
const getMeta = require('../common/get-meta');
const getPropTypes = require('./get-prop-types');
const getPropTypesIdentifierName = require('./get-prop-types-identifier-name');
const isComponentReference = require('./is-component-reference');
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

  // Get the value node of the propTypes declaration
  const propTypes = getPropTypes({ componentName, syntaxTree });

  const returnValue = (propTypes, superClass) => ({
    className: componentName,
    propTypes,
    propTypesMeta,
    superClass
  });

  // Exit if the propTypes definition is a MemberExpression but is not a reference to another component's propTypes.
  if (t.isMemberExpression(propTypes)) {
    return isComponentReference(propTypes)
      ? returnValue(undefined, propTypes.object.name)
      : {};
  }

  if (t.isObjectExpression(propTypes)) {
    return returnValue(parseAST(propTypes, propTypesMeta));
  }

  return {};
};
