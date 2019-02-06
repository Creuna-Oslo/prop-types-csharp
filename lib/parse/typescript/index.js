const assert = require('assert');
const { parse } = require('@babel/parser');

const getComponentName = require('../common/get-component-name');
const getMeta = require('../common/get-meta');
const getPropTypes = require('./get-prop-types');
const metaTypes = require('../../meta-types');
const parseTypes = require('./parse-types');

module.exports = function(sourceCode) {
  assert(sourceCode, 'No source code provided');

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties', 'typescript'],
    sourceType: 'module'
  });

  const { propTypesMeta } = getMeta({ syntaxTree });

  if (propTypesMeta === metaTypes.exclude) {
    return {};
  }

  const { componentName } = getComponentName({ syntaxTree });
  const { typeDeclarations, typeName, types } = getPropTypes({
    componentName,
    syntaxTree
  });

  if (types) {
    return {
      className: typeName || componentName,
      propTypes: parseTypes(types, typeDeclarations),
      propTypesMeta
    };
  }

  if (typeName) {
    return { className: componentName, propTypes: typeName, propTypesMeta };
  }

  throw new Error(`Couldn't find types for '${componentName}'.`);
};
