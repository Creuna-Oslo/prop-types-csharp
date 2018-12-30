const assert = require('assert');

const createDefinitions = require('./transforms/create-definitions');
const parseJavascript = require('./parse/javascript');
const generateCsharp = require('./stringify/lang/csharp');
const transformPropTypes = require('./transforms/transform-prop-types');
const validatePropNames = require('./utils/validate-prop-names');

const parsers = {
  javascript: require('./parse/javascript'),
  typescript: require('./parse/typescript')
};

module.exports = function({
  baseClass,
  generator = generateCsharp,
  indent,
  namespace,
  parser = 'javascript',
  sourceCode
}) {
  assert(
    Object.keys(parsers).includes(parser),
    `'${parser}' is not a supported parser.`
  );
  const { className, propTypes, propTypesMeta } = parsers[parser](sourceCode);

  if (!className || !propTypes) {
    return {};
  }

  validatePropNames(propTypes, className);

  // Strip client-only types, apply meta types and strip 'PropTypes' prefix from types
  const transformedPropTypes = transformPropTypes(propTypes, propTypesMeta);

  const definitions = createDefinitions(transformedPropTypes, className);

  const code = generator({
    baseClass,
    componentName: className,
    definitions,
    indent,
    namespace
  });

  return { componentName: className, code };
};
