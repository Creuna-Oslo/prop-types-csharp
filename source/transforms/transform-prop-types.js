// const generate = require('@babel/generator').default;
const kebabToPascal = require('@creuna/utils/kebab-to-pascal').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');
const getPropTypes = require('../utils/get-prop-types');

const illegalTypes = ['element', 'func', 'instanceOf', 'node'];
const typesThatShouldBeReplaced = ['number'];
const allowedMetaValues = ['double', 'exclude', 'float', 'int'];

module.exports = function(sourceCode, componentName) {
  const pascalComponentName = kebabToPascal(componentName);

  const syntaxTree = parse(sourceCode, {
    plugins: ['jsx', 'classProperties'],
    sourceType: 'module'
  });

  const { propTypes, propTypesMeta } = getPropTypes(
    syntaxTree,
    pascalComponentName
  );

  const illegalMetaType = Object.entries(propTypesMeta).find(
    ([_, value]) => !allowedMetaValues.includes(value)
  );

  if (illegalMetaType) {
    throw new Error(
      `Invalid meta type in component ${pascalComponentName}:\n${
        illegalMetaType[0]
      }: ${illegalMetaType[1]}\nExpected one of [${allowedMetaValues}]`
    );
  }

  traverse(syntaxTree, {
    Program(path) {
      path.replaceWith(t.program([propTypes]));
      path.stop();
    }
  });

  traverse(syntaxTree, {
    MemberExpression(path) {
      // Replace 'PropTypes.x' with 'x' and strip illegal types
      if (path.get('object').isIdentifier({ name: 'PropTypes' })) {
        const parent = path.findParent(parent => parent.isObjectProperty());
        const propName = parent.node.key.name;
        const typeName = path.node.property.name;

        if (illegalTypes.includes(typeName)) {
          return parent.remove();
        }

        if (propTypesMeta[propName]) {
          path.replaceWith(t.identifier(propTypesMeta[propName]));
          return;
        }

        if (typesThatShouldBeReplaced.includes(typeName)) {
          throw new Error(
            `Missing meta type for ${propName} in component ${pascalComponentName}\n`
          );
        }

        path.replaceWith(path.node.property);
      }

      // Replace 'CompomentName.propTypes' with 'ComponentName'
      if (path.get('property').isIdentifier({ name: 'propTypes' })) {
        path.replaceWith(path.node.object);
      }
    }
  });

  traverse(syntaxTree, {
    ObjectProperty(path) {
      // Capitalize object keys or remove excluded props
      const name = path.node.key.name;

      if (propTypesMeta[name] !== 'exclude') {
        path.get('key').replaceWith(t.identifier(capitalize(name)));
      } else {
        path.remove();
      }
    },
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
          const value = path.get('value');

          if (value.isIdentifier()) {
            outputString += `  public ${path.node.value.name} ${
              path.node.key.name
            } { get; set; }\n`;
          }

          if (
            value.isMemberExpression() &&
            value.get('property').isIdentifier({ name: 'isRequired' })
          ) {
            outputString += `  [Required]\n  public ${
              path.node.value.object.name
            } { get; set; }\n`;
          }

          if (
            value.isCallExpression() &&
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
