const { get } = require('kompis');
const t = require('@babel/types');

const isObjectMethod = require('../lib/parse/javascript/is-object-method');
const messages = require('./messages');

const illegalTypes = {
  array: messages.array(),
  object: messages.object(),
  oneOfType: messages.oneOfType()
};

const makeHasLiteral = variablesInScope => (node, babelValidator) =>
  variablesInScope.some(
    variable =>
      variable.name === node.name &&
      babelValidator(variable.references[0].writeExpr)
  );

const getInvalidPropTypes = (objectExpression, scope) => {
  const childScope = get('childScopes[0]', {})(scope);
  const variablesInScope = childScope.type === 'module' && childScope.variables;
  const hasLiteral = makeHasLiteral(variablesInScope);

  if (!objectExpression || !objectExpression.properties) {
    return {};
  }

  return objectExpression.properties.reduce((accum, objectProperty) => {
    const key = objectProperty.key.name;
    const value = objectProperty.value;

    // Function calls not coming from PropTypes are illegal. Detect this by checking if the callee is an identifier (PropTypes.something is a MemberExpression).
    if (t.isCallExpression(value) && t.isIdentifier(value.callee)) {
      return Object.assign(accum, {
        [key]: { node: value, message: messages.illegalFunctionCall() }
      });
    }

    // propTypeNode might be a CallExpression node (like in 'PropTypes.arrayOf()'), in which case the propType node will be accessible in obectProperty.value.callee. If not, the node is a MemberExpression, and the node is accessible in objectProperty.value.
    const propTypeNode = value.callee || value;

    if (!t.isMemberExpression(propTypeNode)) {
      return Object.assign(accum, {
        [key]: { node: value, message: messages.illegalIdentifier() }
      });
    }

    const isRequired =
      t.isMemberExpression(propTypeNode.object) &&
      t.isIdentifier(propTypeNode.property, { name: 'isRequired' });

    // If .isRequired is used, 'propTypeNode.object' will be another MemberExpression. The type name will be accessible in the 'property' property of 'propTypeNode.object'.
    const propTypeName = isRequired
      ? propTypeNode.object.property.name
      : propTypeNode.property.name;

    if (illegalTypes[propTypeName]) {
      accum[key] = {
        node: propTypeNode.property,
        message: illegalTypes[propTypeName]
      };
    }

    if (t.isCallExpression(value)) {
      value.arguments.filter(t.isMemberExpression).forEach(argument => {
        const typeName = argument.property.name;
        if (illegalTypes[typeName]) {
          accum[key] = {
            node: argument.property,
            message: illegalTypes[typeName]
          };
        }
      });
    }

    // Check member expressions or recursively check object literals inside shape and exact
    if (
      t.isCallExpression(value) &&
      ['shape', 'exact'].includes(propTypeName)
    ) {
      const [argument] = value.arguments;

      if (
        t.isMemberExpression(argument) &&
        !t.isIdentifier(argument.property, { name: 'propTypes' })
      ) {
        return Object.assign(accum, {
          [key]: { node: argument, message: messages.illegalReference() }
        });
      }

      return Object.assign(accum, {
        [key]: getInvalidPropTypes(argument, scope)
      });
    }

    // Check for references inside PropTypes.oneOf. Run checks only if there are defined variables in scope. Undefined variables are caught by 'no-undef', which every sane person should be using.
    if (
      t.isCallExpression(value) &&
      propTypeName === 'oneOf' &&
      variablesInScope.length
    ) {
      const [argument] = value.arguments;

      // Check references to arrays
      if (t.isIdentifier(argument)) {
        if (!hasLiteral(argument, t.isArrayExpression)) {
          accum[key] = {
            node: argument,
            message: messages.importedArrayReference()
          };
        }
      }

      // Check references to objects in Object.keys and Object.values
      if (
        t.isCallExpression(argument) &&
        isObjectMethod(argument) &&
        ['keys', 'values'].includes(argument.callee.property.name)
      ) {
        const [objectMethodArgument] = argument.arguments;

        if (objectMethodArgument) {
          if (!hasLiteral(objectMethodArgument, t.isObjectExpression)) {
            accum[key] = {
              node: objectMethodArgument,
              message: messages.importedObjectReference()
            };
          }
        } else {
          accum[key] = {
            node: argument,
            message: messages.missingObjectReference()
          };
        }
      }
    }

    return accum;
  }, {});
};

module.exports = getInvalidPropTypes;
