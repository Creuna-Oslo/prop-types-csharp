const assert = require('assert');
const { parse } = require('@babel/parser');

const getComponentName = require('../../utils/get-component-name');
const getPropTypes = require('./get-prop-types');
const parseTypes = require('./parse-types');

module.exports = function(sourceCode) {
  assert(sourceCode, 'No source code provided');

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties', 'typescript'],
    sourceType: 'module'
  });

  const { componentName } = getComponentName({ syntaxTree });

  const { typeDeclarations, typeName, types } = getPropTypes({
    componentName,
    syntaxTree
  });

  if (types) {
    return {
      className: typeName || componentName,
      propTypes: parseTypes(types, typeDeclarations)
    };
  }

  if (typeName) {
    return { className: componentName, propTypes: typeName };
  }

  throw new Error(`Couldn't find types for '${componentName}'.`);
};
