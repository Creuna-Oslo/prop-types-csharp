// const generate = require('@babel/generator').default;
const anyToKebab = require('@creuna/utils/any-to-kebab').default;
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('babel-types');

const capitalize = require('../utils/capitalize');
const getComponentName = require('../utils/get-component-name');
const getPropTypes = require('../utils/get-prop-types');
const unknownToPascal = require('../utils/unknown-to-pascal');

const allowedMetaValues = ['exclude', 'float', 'int'];
const illegalTypes = ['number', 'object'];
const typesToStrip = ['element', 'func', 'instanceOf', 'node'];

module.exports = function(sourceCode, filePath) {
  try {
    const syntaxTree = parse(sourceCode, {
      plugins: ['jsx', 'classProperties'],
      sourceType: 'module'
    });

    const { componentName } = getComponentName(syntaxTree, filePath);
    const kebabComponentName = anyToKebab(componentName);

    const { propTypesAST, propTypesIdentifier, propTypesMeta } = getPropTypes(
      syntaxTree,
      componentName
    );

    const illegalMetaType = Object.entries(propTypesMeta).find(
      ([_, metaType]) =>
        typeof metaType === 'string' && !allowedMetaValues.includes(metaType)
    );

    if (illegalMetaType) {
      throw new Error(
        `Invalid meta type '${illegalMetaType[1]}' for '${
          illegalMetaType[0]
        }'. Expected one of [${allowedMetaValues}]`
      );
    }

    traverse(syntaxTree, {
      Program(path) {
        path.replaceWith(t.program([propTypesAST]));
        path.stop();
      }
    });

    traverse(syntaxTree, {
      MemberExpression(path) {
        // Replace 'PropTypes.x' with 'x' and strip illegal types
        if (path.get('object').isIdentifier({ name: propTypesIdentifier })) {
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
              `Invalid type '${typeName}' for prop '${propName}'`
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
        const argument = path.node.arguments[0];
        const isArrayOf = path.findParent(
          parent =>
            t.isCallExpression(parent) &&
            parent.get('callee').isIdentifier({ name: 'arrayOf' })
        );
        const isIdentifier = t.isIdentifier(argument);
        const isOneOf = path.get('callee').isIdentifier({ name: 'oneOf' });
        const isShape = path.get('callee').isIdentifier({ name: 'shape' });
        const prop = path.findParent(parent => t.isObjectProperty(parent));
        const propName = prop.node.key.name;
        const propDefinitionName =
          capitalize(propName) + (isArrayOf ? 'Item' : '');
        const program = path.findParent(parent => t.isProgram(parent));

        if (!isShape && !isOneOf) {
          return;
        }

        // Replace propTypes.shape and propTypes.oneOf with new definitions
        // Identifiers as shape are interpreted as a reference to the propTypes of another components (propTypes.shape(SomeComponent.propTypes)). If the call argument is an identifier, skip creating a new definition for it.
        if (!isIdentifier || isOneOf) {
          program.pushContainer(
            'body',
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.identifier(propDefinitionName),
                argument
              )
            )
          );
        }

        path.replaceWith(
          isIdentifier ? argument : t.identifier(propDefinitionName)
        );
      }
    });

    // At this point, the code has been transformed into something like this:

    // Component = {
    //   text: string.isRequired,
    //   texts: arrayOf(string),
    //   singleObject: SingleObject,
    //   objects: arrayOf(ObjectsItem).isRequired,
    //   enumArray: EnumArray,
    // };
    // SingleObject = {
    //   propertyA: string.isRequired
    // };
    // ObjectsItem = {
    //   propertyB: string
    // };
    // EnumArray = ['value-1', 'value-2'];

    let outputString = 'using System.Collections;\n\n';

    // Hack hackity hack custom 'generator'
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

    return { code: outputString, kebabComponentName };
  } catch (error) {
    throw new Error(`C# class generator plugin, file ${filePath}:\n${error}\n`);
  }
};
