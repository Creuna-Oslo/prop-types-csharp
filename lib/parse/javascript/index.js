const assert = require('assert');
const { match, otherwise } = require('kompis');
const { parse } = require('@babel/parser');
const t = require('@babel/types');

const expandReferences = require('./expand-references');
const getComponentName = require('../common/get-component-name');
const getMeta = require('../common/get-meta');
const getPropTypes = require('./get-prop-types');
const getPropTypesFromFunction = require('./get-prop-types-from-function');
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

  const makeReturnValue = (propTypes, superClass) => ({
    className: componentName,
    propTypes: parseAST(propTypes, propTypesMeta),
    propTypesMeta,
    superClass
  });

  return match(
    [
      t.isMemberExpression,
      p => (isComponentReference(p) ? makeReturnValue({}, p.object.name) : {})
    ],
    [t.isCallExpression, p => makeReturnValue(...getPropTypesFromFunction(p))],
    [t.isObjectExpression, makeReturnValue],
    [otherwise, () => ({})]
  )(propTypes);
};
