const assert = require('assert');
const { Pipe } = require('kompis');

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
  const { className, propTypes, propTypesMeta, superClass } = parser(
    sourceCode
  );

  if (!className || (!propTypes && !superClass)) {
    return {};
  }

  if (propTypesMeta === 'exclude') {
    return {};
  }

  const definitions = propTypes
    ? Pipe(
        validatePropNames(className),
        transformPropTypes(propTypesMeta),
        createDefinitions(className)
      )(propTypes)
    : createDefinitions(className)({});

  const code = generator({
    baseClass: superClass || baseClass,
    className,
    definitions,
    indent,
    namespace
  });

  return { className, code };
};
