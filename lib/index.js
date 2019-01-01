const assert = require('assert');

const createDefinitions = require('./create-definitions');
const generateCsharp = require('./stringify/lang/csharp');
const parseJavascript = require('./parse/javascript');
const transformPropTypes = require('./transform-prop-types');
const validatePropNames = require('./validate-prop-names');

module.exports = function({
  baseClass,
  generator = generateCsharp,
  indent,
  namespace,
  parser = parseJavascript,
  sourceCode
}) {
  assert(typeof parser === 'function', 'Options.parser is not a function.');
  const { className, propTypes, propTypesMeta } = parser(sourceCode);

  if (!className || !propTypes) {
    return {};
  }

  if (propTypesMeta === 'exclude') {
    return {};
  }

  validatePropNames(propTypes, className);

  // Strip client-only types, apply meta types and strip 'PropTypes' prefix from types
  const transformedPropTypes = transformPropTypes(propTypes, propTypesMeta);

  const definitions = createDefinitions(transformedPropTypes, className);

  const code = generator({
    baseClass,
    className,
    definitions,
    indent,
    namespace
  });

  return { className, code };
};
