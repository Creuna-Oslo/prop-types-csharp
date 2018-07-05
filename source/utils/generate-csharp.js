const traverse = require('@babel/traverse').default;

const capitalize = require('./capitalize');
const unknownToPascal = require('./unknown-to-pascal');

module.exports = function({ syntaxTree }) {
  let outputString = 'using System.Collections;\n\n';

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const className = capitalize(path.node.left.name);
      const isArrayExpression = path.get('right').isArrayExpression();

      outputString += `public ${
        isArrayExpression ? 'enum' : 'class'
      } ${className} \n{\n`;

      if (!isArrayExpression) {
        path.get('right').traverse({
          ObjectProperty(path) {
            const typeNode = path.node.value;
            const typePath = path.get('value');
            const propName = capitalize(path.node.key.name);
            const isObject = typePath.isMemberExpression();
            const isRequired =
              isObject &&
              typePath.get('property').isIdentifier({ name: 'isRequired' });
            const isArray = isObject
              ? typePath.get('object').isCallExpression() &&
                typePath.node.object.callee.name === 'arrayOf'
              : typePath.isCallExpression() &&
                typeNode.callee.name === 'arrayOf';

            let typeName;

            // type
            if (typePath.isIdentifier()) {
              typeName = typeNode.name;
            }

            // type.isRequired
            if (isObject && typePath.get('object').isIdentifier()) {
              typeName = typeNode.object.name;
            }

            if (isArray) {
              typeName = isObject
                ? typeNode.object.arguments[0].name // arrayOf(type).isRequired
                : path.node.value.arguments[0].name; // arrayOf(type)
            }

            const type = isArray ? `IList<${typeName}>` : typeName;

            outputString += isRequired ? `  [Required]\n` : '';
            outputString += `  public ${type} ${propName} { get; set; }\n`;
          }
        });
      } else {
        const array = path.node.right.elements;
        array.forEach((enumProperty, index) => {
          const value = enumProperty.value;
          const isNumber = typeof value === 'number';
          const prefix = isNumber ? className : '';

          outputString += isNumber ? '' : `  [StringValue("${value}")]\n`;
          outputString += `  ${unknownToPascal(prefix + value)} = ${
            isNumber ? value : index
          },\n`;
        });
      }
      outputString += '}\n\n';
    }
  });

  return outputString;
};
