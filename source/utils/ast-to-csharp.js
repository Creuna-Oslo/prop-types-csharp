const t = require('babel-types');

const capitalize = require('./capitalize');
const generateCSharpType = require('./generate-csharp-type');
const isEnumRequired = require('./is-enum-required');
const unknownToPascal = require('./unknown-to-pascal');

// Expects syntax tree consisting of only assignment expression nodes in the program.body node
module.exports = function({ syntaxTree }) {
  const assignmentExpressions = syntaxTree.program.body.map(
    expressionStatement => expressionStatement.expression
  );

  return (
    'using System.Collections.Generic;\n\n' +
    assignmentExpressions.reduce((accum, assignmentNode) => {
      const className = capitalize(assignmentNode.left.name);
      const isArrayExpression = t.isArrayExpression(assignmentNode.right);

      if (isArrayExpression) {
        const isNullable =
          !assignmentNode.right.elements.find(p => p.value === 0) &&
          !isEnumRequired(assignmentExpressions, className);

        return (
          accum +
          `public enum ${className} \n{\n` +
          assignmentNode.right.elements.reduce(
            (accum, enumProperty, index, array) => {
              const value = enumProperty.value;
              const isNumber = typeof value === 'number';
              const prefix = isNumber ? className : '';
              const isLast = index === array.length - 1;
              const adjustedIndex = index + (isNullable ? 1 : 0);

              if (index === 0 && isNullable) {
                accum += '  None = 0,\n';
              }

              accum += isNumber ? '' : `  [StringValue("${value}")]\n`;
              accum += `  ${unknownToPascal(prefix + value)} = ${
                isNumber ? value : adjustedIndex
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
          assignmentNode.right.properties.reduce(
            (accum, node, index, array) => {
              // 'node' is an ObjectProperty node
              const typeNode = node.value;
              const propName = capitalize(node.key.name);
              const isLast = index === array.length - 1;
              const isObject = t.isMemberExpression(typeNode);
              const isRequired =
                isObject &&
                t.isIdentifier(typeNode.property, { name: 'isRequired' });

              const type = generateCSharpType(typeNode, node.key.name);

              accum += isRequired ? `  [Required]\n` : '';
              accum += `  public ${type} ${propName} { get; set; }\n`;
              accum += isLast ? '}\n\n' : '';
              return accum;
            },
            ''
          )
        );
      }
    }, '')
  );
};
