const addIndentation = require('./indent');
const { generateClass, generateClassExtends } = require('./generator');
const imports = require('./imports');

// Expects syntax tree consisting of only assignment expression nodes in the program.body node
module.exports = function({
  baseClass,
  componentName,
  definitions,
  indent = 2,
  namespace
}) {
  // If 'definitions' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof definitions === 'string'
      ? generateClassExtends(componentName, definitions)
      : definitions
          .map(({ name, properties }) =>
            generateClass(name, properties, componentName, baseClass)
          )
          .join('\n\n');

  const classesWithNamespace = namespace
    ? `namespace ${namespace}\n{\n${classesString}\n}`
    : classesString;

  const fileContent = `${imports}\n${classesWithNamespace}`;

  return addIndentation(fileContent, indent);
};
