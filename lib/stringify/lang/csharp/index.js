const { generateClass, generateClassExtends } = require('./generator');
const indentBraces = require('../../indent-braces');
const imports = require('./imports');

// Expects syntax tree consisting of only assignment expression nodes in the program.body node
module.exports = function({
  baseClass,
  className,
  definitions,
  indent = 2,
  namespace
}) {
  // If 'definitions' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof definitions === 'string'
      ? generateClassExtends(className, definitions)
      : definitions
          .map(({ name, parent, properties }) =>
            generateClass(name, properties, parent, baseClass)
          )
          .join('\n\n');

  const classesWithNamespace = namespace
    ? `namespace ${namespace}\n{\n${classesString}\n}`
    : classesString;

  const fileContent = `${imports}\n${classesWithNamespace}\n`;

  return indentBraces(fileContent, indent);
};
