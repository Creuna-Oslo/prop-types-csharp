const flattenDefinitions = require('../../utils/flatten-definitions');
const { generateClass, generateClassExtends } = require('./generator');
const indentBraces = require('../indent-braces');
const imports = require('./imports');

module.exports = function(
  propTypes = {},
  className,
  { baseClass, indent = 2, instantiateProperties, namespace } = {}
) {
  // If 'propTypes' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof propTypes === 'string'
      ? generateClassExtends(className, propTypes)
      : flattenDefinitions(propTypes, className)
          .map(({ name, properties }) =>
            generateClass(name, properties, baseClass, instantiateProperties)
          )
          .join('\n\n');

  const classesWithNamespace = namespace
    ? `namespace ${namespace}\n{\n${classesString}\n}`
    : classesString;

  const fileContent = `${imports}\n${classesWithNamespace}\n`;

  return indentBraces(fileContent, indent);
};
