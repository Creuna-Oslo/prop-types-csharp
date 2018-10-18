const addIndentation = require('./indent');
const generate = require('./generator');
const imports = require('./imports');

// Expects syntax tree consisting of only assignment expression nodes in the program.body node
module.exports = function({
  baseClass,
  classes,
  componentName,
  indent = 2,
  namespace
}) {
  const classesString = classes
    .map(({ name, properties }) =>
      generate(name, properties, componentName, baseClass)
    )
    .join('\n\n');

  const classesWithNamespace = namespace
    ? `namespace ${namespace}\n{\n${classesString}\n}`
    : classesString;

  const fileContent = `${imports}\n${classesWithNamespace}`;

  return addIndentation(fileContent, indent);
};
