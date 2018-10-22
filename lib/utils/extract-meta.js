const t = require('@babel/types');

const getNodeOfType = require('./get-node-of-type');

const { strings: allowedStringTypes } = require('../meta-types');

const validateStringType = (node, propertyName) => {
  const { value } = node;
  if (!allowedStringTypes[value]) {
    throw new Error(
      `Invalid meta type '${value}' for '${propertyName}'. Expected one of [${Object.values(
        allowedStringTypes
      )}]`
    );
  }
};

const validateCallExpression = (node, propertyName) => {
  if (node.callee.name !== 'Array') {
    const error = `Unsupported function call in meta type for '${propertyName}'`;
    throw new Error(error);
  }

  const [argument] = node.arguments;

  if (!argument) {
    const error = `Missing value in 'Array' in meta type for '${propertyName}'`;
    throw new Error(error);
  }

  if (!t.isIdentifier(argument) && !t.isObjectExpression(argument)) {
    throw new Error(
      `Unsupported value in Array() in meta type for '${propertyName}'`
    );
  }
};

const getMetaNode = (node, propertyName) =>
  getNodeOfType(
    node,
    {
      StringLiteral: node => {
        validateStringType(node, propertyName);
        return { type: node.value };
      },
      Identifier: node => ({ type: node.name }),
      ObjectExpression: node => ({
        type: 'shape',
        argument: extractMeta(node.properties)
      }),
      CallExpression: node => {
        validateCallExpression(node, propertyName);
        return {
          type: 'arrayOf',
          argument: getMetaNode(node.arguments[0])
        };
      }
    },
    () => {
      throw new Error(`Unsupported meta type for '${propertyName}'`);
    }
  );

function extractMeta(metaProperties) {
  return metaProperties.reduce((accum, property) => {
    const propertyName = property.key.name;
    const meta = getMetaNode(property.value, property.key.name);

    return Object.assign({}, accum, { [propertyName]: meta });
  }, {});
}

module.exports = extractMeta;
