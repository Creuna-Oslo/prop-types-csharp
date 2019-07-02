const assert = require('assert');

const generateCsharp = require('./stringify/csharp');
const parseJavascript = require('./parse/javascript');
const validatePropNames = require('./validate-prop-names');

module.exports = function(
  sourceCode,
  {
    baseClass,
    generator = generateCsharp,
    indent,
    namespace,
    parser = parseJavascript
  } = {}
) {
  assert(typeof parser === 'function', 'Options.parser is not a function.');
  const { className, propTypes, propTypesMeta, superClass } = parser(
    sourceCode
  );

  if (!className || (!propTypes && !superClass)) {
    return {};
  }

  if (propTypesMeta === 'exclude') {
    return {};
  }

  validatePropNames(className, propTypes || {});

  const code = generator(propTypes, className, {
    baseClass: superClass || baseClass,
    indent,
    namespace
  });

  return { className, code };
};
