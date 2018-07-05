const t = require('babel-types');

const capitalize = require('./capitalize');
const unknownToPascal = require('./unknown-to-pascal');

const badTypeError = propName => {
  return new Error(
    `Found bad type for ${propName}. Please check for incompatibilities with this plugin:\n
• Wrap references other Components' propTypes with 'PropTypes.shape'
• Don't reference imported objects/arrays in 'PropTypes.oneOf'
• Don't use non-PropTypes functions in propType definition`
  );
};

module.exports = function({ syntaxTree }) {
  const assignmentExpressions = syntaxTree.program.body.map(
    expressionStatement => expressionStatement.expression
  );

  const code = assignmentExpressions.reduce((accum, assignmentNode) => {
    const className = capitalize(assignmentNode.left.name);
    const isArrayExpression = t.isArrayExpression(assignmentNode.right);

    if (isArrayExpression) {
      return (
        accum +
        `public enum ${className} \n{\n` +
        assignmentNode.right.elements.reduce(
          (accum, enumProperty, index, array) => {
            const value = enumProperty.value;
            const isNumber = typeof value === 'number';
            const prefix = isNumber ? className : '';
            const isLast = index === array.length - 1;

            accum += isNumber ? '' : `  [StringValue("${value}")]\n`;
            accum += `  ${unknownToPascal(prefix + value)} = ${
              isNumber ? value : index
            },\n`;
            accum += isLast ? '}\n\n' : '';
            return accum;
          },
          ''
        )
      );
    } else {
      return (
        accum +
        `public class ${className} \n{\n` +
        assignmentNode.right.properties.reduce((accum, node, index, array) => {
          const typeNode = node.value;
          const propName = capitalize(node.key.name);
          const isLast = index === array.length - 1;
          const isObject = t.isMemberExpression(typeNode);
          const isRequired =
            isObject &&
            t.isIdentifier(typeNode.property, { name: 'isRequired' });
          const isArray = isObject
            ? t.isCallExpression(typeNode.object) &&
              typeNode.object.callee.name === 'arrayOf'
            : t.isCallExpression(typeNode) &&
              typeNode.callee.name === 'arrayOf';

          let typeName;

          // type
          if (t.isIdentifier(typeNode)) {
            typeName = typeNode.name;
          }

          // type.isRequired
          if (isObject && t.isIdentifier(typeNode.object)) {
            typeName = typeNode.object.name;
          }

          if (isArray) {
            typeName = isObject
              ? typeNode.object.arguments[0].name // arrayOf(type).isRequired
              : typeNode.arguments[0].name; // arrayOf(type)
          }

          if (!typeName) {
            throw badTypeError(node.key.name);
          }

          const type = isArray ? `IList<${typeName}>` : typeName;

          accum += isRequired ? `  [Required]\n` : '';
          accum += `  public ${type} ${propName} { get; set; }\n`;
          accum += isLast ? '}\n\n' : '';
          return accum;
        }, '')
      );
    }
  }, '');

  const hasList = code.match(/IList<.+>/);

  return hasList ? `using System.Collections;\n\n${code}` : code;
};
