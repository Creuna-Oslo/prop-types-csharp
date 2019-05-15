const { generateClass, generateClassExtends } = require('./generator');
const indentBraces = require('../../indent-braces');
const imports = require('./imports');

module.exports = function(
  definitions,
  className,
  { baseClass, indent = 2, namespace } = {}
) {
  // If 'definitions' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof definitions === 'string'
      ? generateClassExtends(className, definitions)
      : definitions
          .map(({ name, properties }) =>
            generateClass(name, properties, baseClass)
          )
          .join('\n\n');

  const classesWithNamespace = namespace
    ? `namespace ${namespace}\n{\n${classesString}\n}`
    : classesString;

  const fileContent = `${imports}\n${classesWithNamespace}\n`;

  return indentBraces(fileContent, indent);
};
