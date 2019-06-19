const dotNotation = require('../dot-notation');
const flattenDefinitions = require('../../utils/flatten-definitions');
const { generateClass, generateClassExtends } = require('./generator');
const generateImports = require('./generate-imports');
const indentBraces = require('../indent-braces');

module.exports = function generateKotlin(
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

  const componentImports =
    typeof propTypes === 'string' ? [] : generateImports(propTypes, namespace);
  const imports = []
    .concat(
      baseClass ? dotNotation(namespace, baseClass, '*') : [],
      componentImports
    )
    .map(i => `import ${i}`)
    .join('\n');
  const importsString = imports.length > 0 ? `${imports}\n\n` : '';

  const packageString = `package ${dotNotation(namespace, className)}`;

  const fileContent = `${packageString}\n\n${importsString}${classesString}\n`;

  return indentBraces(fileContent, indent, ['{', '('], ['}', ')']);
};
