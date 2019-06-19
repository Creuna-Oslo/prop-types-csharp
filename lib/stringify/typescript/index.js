const { generateClass, generateClassExtends } = require('./generator');
const getNonBasicTypes = require('../get-non-basic-types');
const indentBraces = require('../indent-braces');

module.exports = function(
  propTypes = {},
  className,
  { baseClass, indent = 2, instantiateProperties, namespace } = {}
) {
  // If 'propTypes' is a string, the propTypes of the component is a reference to the propTypes of another component. In that case, create a class that extends the other component's class.
  const classesString =
    typeof propTypes === 'string'
      ? generateClassExtends(className, propTypes)
      : generateClass(className, propTypes, baseClass, instantiateProperties);

  const classesWithNamespace = namespace
    ? `namespace ${namespace} {\n${classesString}\n}`
    : classesString;
  const componentImports =
    typeof propTypes === 'string' ? [] : getNonBasicTypes(propTypes);
  const importsString = []
    .concat(baseClass || [], componentImports)
    .map(i => `import { ${i} } from "./${i}";`)
    .join('\n');

  const fileContent = `${importsString}\n\n${classesWithNamespace}\n`;

  return indentBraces(fileContent, indent);
};
