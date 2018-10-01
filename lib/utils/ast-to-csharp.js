const t = require('@babel/types');

const capitalize = require('./capitalize');
const generateCSharpType = require('./generate-csharp-type');
const isEnumRequired = require('./is-enum-required');
const unknownToPascal = require('./unknown-to-pascal');

// Expects syntax tree consisting of only assignment expression nodes in the program.body node
module.exports = function({
  baseClass,
  componentName,
  indent = 2,
  namespace,
  syntaxTree
}) {
  const assignmentExpressions = syntaxTree.program.body.map(
    expressionStatement => expressionStatement.expression
  );
  const baseIndent = namespace ? ' '.repeat(indent) : '';

  // The closing '}' for the namespace is added at the bottom of this file!
  const namespaceDeclaration = namespace ? `namespace ${namespace}\n{\n` : '';

  return (
    'using System.Collections.Generic;\n' +
    'using System.ComponentModel.DataAnnotations;\n' +
    'using System.Runtime.Serialization;\n\n' +
    namespaceDeclaration +
    assignmentExpressions.reduce((accum, assignmentNode) => {
      const className = capitalize(assignmentNode.left.name);
      const isArrayExpression = t.isArrayExpression(assignmentNode.right);
      const isMainClass = className === componentName;
      const baseClassString =
        isMainClass && baseClass && baseClass !== className
          ? `: ${baseClass}`
          : '';

      // I realize this name is a little weird but I didn't want to have a long variable name inside the string templates.
      const _indent = baseIndent + ' '.repeat(indent);

      // If the right part of the assignment is an identifier, it's a reference to the propTypes of another component. Return an empty class that extends the other component's class.
      if (t.isIdentifier(assignmentNode.right)) {
        return (
          `${baseIndent}public class ${className} : ${
            assignmentNode.right.name
          }` + `\n${baseIndent}{\n${baseIndent}}\n`
        );
      }

      if (isArrayExpression) {
        const isNullable =
          !assignmentNode.right.elements.find(p => p.value === 0) &&
          !isEnumRequired(assignmentExpressions, className);

        return (
          accum +
          `${baseIndent}public enum ${className} \n` +
          `${baseIndent}{\n` +
          assignmentNode.right.elements.reduce(
            (accum, enumProperty, index, array) => {
              const value = enumProperty.value;
              const isNumber = typeof value === 'number';
              const prefix = isNumber ? className : '';
              const isLast = index === array.length - 1;
              const adjustedIndex = index + (isNullable ? 1 : 0);

              if (index === 0 && isNullable) {
                accum += `${_indent}None = 0,\n`;
              }

              accum += isNumber
                ? ''
                : `${_indent}[EnumMember(Value = "${value}")]\n`;
              accum += `${_indent}${unknownToPascal(prefix + value)} = ${
                isNumber ? value : adjustedIndex
              },\n`;
              accum += isLast ? `${baseIndent}}\n\n` : '';
              return accum;
            },
            ''
          )
        );
      } else {
        return (
          accum +
          `${baseIndent}public class ${className} ${baseClassString}\n` +
          `${baseIndent}{\n` +
          assignmentNode.right.properties.reduce((accum, node) => {
            // 'node' is an ObjectProperty node
            const typeNode = node.value;
            const propName = capitalize(node.key.name);
            const isObject = t.isMemberExpression(typeNode);
            const isRequired =
              isObject &&
              t.isIdentifier(typeNode.property, { name: 'isRequired' });

            const type = generateCSharpType(typeNode, node.key.name);

            accum += isRequired ? `${_indent}[Required]\n` : '';
            accum += `${_indent}public ${type} ${propName} { get; set; }\n`;
            return accum;
          }, '') +
          `${baseIndent}}\n\n`
        );
      }
    }, '') +
    (namespace ? '}' : '')
  );
};
