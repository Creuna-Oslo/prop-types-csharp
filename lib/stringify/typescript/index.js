const { generateClass, generateClassExtends } = require('./generator');
const getReferences = require('../get-references');
const indentBraces = require('../indent-braces');

module.exports = function generateTypescript(
  propTypes = {},
  className,
  { baseClass, header, indent = 2, namespace } = {}
) {
  // If 'propTypes' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof propTypes === 'string'
      ? generateClassExtends(className, propTypes)
      : generateClass(className, propTypes, baseClass);

  const headerString = header ? `${header}\n` : '';
  const classesWithNamespace = namespace
    ? `namespace ${namespace} {\n${classesString}\n}`
    : classesString;
  const componentImports =
    typeof propTypes === 'string' ? [] : getReferences(propTypes);
  const importsString = []
    .concat(baseClass || [], componentImports)
    .map(i => `import { ${i} } from "./${i}";`)
    .join('\n');

  const fileContent = `${headerString}${importsString}\n\n${classesWithNamespace}\n`;

  return indentBraces(fileContent, indent);
};
