const createDefinitions = require('./transforms/create-definitions');
const parseJavascript = require('./parse/javascript');
const generateCsharp = require('./stringify/lang/csharp');
const transformPropTypes = require('./transforms/transform-prop-types');
const validatePropNames = require('./utils/validate-prop-names');

module.exports = function({
  baseClass,
  generator = generateCsharp,
  indent,
  namespace,
  sourceCode
}) {
  const { className, propTypes, propTypesMeta } = parseJavascript(sourceCode);

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
