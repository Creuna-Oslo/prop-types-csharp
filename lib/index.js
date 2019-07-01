const assert = require('assert');
const { Pipe } = require('kompis');

const generateCsharp = require('./stringify/csharp');
const parseJavascript = require('./parse/javascript');
const transformPropTypes = require('./transform-prop-types');
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

  const transformedPropTypes = Pipe(
    validatePropNames(className),
    transformPropTypes(propTypesMeta)
  )(propTypes || {});

  const code = generator(transformedPropTypes, className, {
    baseClass: superClass || baseClass,
    indent,
    namespace
  });

  return { className, code };
};
