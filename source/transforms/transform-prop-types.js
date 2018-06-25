// const generate = require('@babel/generator').default;
const kebabToPascal = require('@creuna/utils/kebab-to-pascal').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');

module.exports = function(sourceCode, componentName) {
  const pascalComponentName = kebabToPascal(componentName);

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      const left = path.get('left');

      // Remove everything but propTypes from Program Node
      if (t.isMemberExpression(left)) {
        if (left.get('object').isIdentifier({ name: pascalComponentName })) {
          if (left.get('property').isIdentifier({ name: 'propTypes' })) {
            const program = path.findParent(parent => t.isProgram(parent));
            if (program) {
              program.replaceWith(
                t.program([
                  t.expressionStatement(
                    t.assignmentExpression(
                      '=',
                      t.identifier(pascalComponentName),
                      path.node.right
                    )
                  )
                ])
              );
              path.skip();
            }
          }
        }
      }
    }
  });

  traverse(syntaxTree, {
    ObjectProperty(path) {
      // Capitalize object keys
      path.get('key').replaceWith(t.identifier(capitalize(path.node.key.name)));
    },

    MemberExpression(path) {
      // Replace 'PropTypes.x' with 'x'
      if (path.get('object').isIdentifier({ name: 'PropTypes' })) {
        path.replaceWith(path.node.property);
      }

      // Replace 'CompomentName.propTypes' with 'ComponentName'
      if (path.get('property').isIdentifier({ name: 'propTypes' })) {
        path.replaceWith(path.node.object);
      }
    }
  });

  traverse(syntaxTree, {
    CallExpression(path) {
      // Replace propTypes.shape with new definitions
      if (path.get('callee').isIdentifier({ name: 'shape' })) {
        const isArrayOf = path.findParent(
          parent =>
            t.isCallExpression(parent) &&
            parent.get('callee').isIdentifier({ name: 'arrayOf' })
        );
        const prop = path.findParent(parent => t.isObjectProperty(parent));
        const propName = prop.node.key.name;
        const propDefinitionName =
          capitalize(propName) + (isArrayOf ? 'Item' : '');

        const program = path.findParent(parent => t.isProgram(parent));
        program.pushContainer(
          'body',
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier(propDefinitionName),
              path.node.arguments[0]
            )
          )
        );

        path.replaceWith(t.identifier(propDefinitionName));
      }
    }
  });

  // Hack hackity hack custom 'generator'
  let outputString = '';

  traverse(syntaxTree, {
    AssignmentExpression(path) {
      outputString += `public class ${path.node.left.name} \n{\n`;

      path.get('right').traverse({
        ObjectProperty(path) {
          if (path.get('value').isIdentifier()) {
            outputString += `  public ${path.node.value.name} ${
              path.node.key.name
            } { get; set; }\n`;
          }

          if (
            path.get('value').isCallExpression() &&
            path.node.value.callee.name === 'arrayOf'
          ) {
            outputString += `  public ${path.node.value.arguments[0].name}[] ${
              path.node.key.name
            } { get; set; }\n`;
          }
        }
      });
      outputString += '}\n\n';
    }
  });

  return outputString;

  // const { code } = generate(syntaxTree);

  // return code;
};
