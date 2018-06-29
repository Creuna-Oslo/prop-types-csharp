// const generate = require('@babel/generator').default;
const kebabToPascal = require('@creuna/utils/kebab-to-pascal').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');
const getPropTypes = require('../utils/get-prop-types');

const typesToStrip = ['element', 'func', 'instanceOf', 'node'];
const illegalTypes = ['number', 'object'];
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

        if (typesToStrip.includes(typeName)) {
          return parent.remove();
        }

        if (propTypesMeta[propName]) {
          path.replaceWith(t.identifier(propTypesMeta[propName]));
          return;
        }

        if (illegalTypes.includes(typeName)) {
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
      // Remove excluded propTypes
      if (propTypesMeta[path.node.key.name] === 'exclude') {
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
      outputString += `public class ${capitalize(path.node.left.name)} \n{\n`;

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
            : typePath.isCallExpression() && typeNode.callee.name === 'arrayOf';

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

          outputString += isRequired ? `  [Required]\n` : '';
          outputString += `  public ${typeName}`;
          outputString += isArray ? '[]' : '';
          outputString += ` ${propName} { get; set; }\n`;
        }
      });
      outputString += '}\n\n';
    }
  });

  return outputString;

  // const { code } = generate(syntaxTree);

  // return code;
};
