const t = require('@babel/types');

const matchNode = require('../../utils/match-node');

const { strings: allowedStringTypes } = require('../../meta-types');

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

const getMetaNode = (node, propertyName) =>
  matchNode(
    node,
    {
      StringLiteral: node => {
        validateStringType(node, propertyName);
        return { type: node.value };
      },
      Identifier: node => ({ type: node.name }),
      ObjectExpression: node => ({
        type: 'shape',
        argument: getMetaProperties(node)
      }),
      ArrayExpression: node => {
        const [element] = node.elements;

        if (!element) {
          const error = `Missing value in meta type for '${propertyName}'`;
          throw new Error(error);
        }
        return {
          type: 'arrayOf',
          argument: getMetaNode(element, propertyName)
        };
      }
    },
    () => {
      throw new Error(`Unsupported meta type for '${propertyName}'`);
    }
  );

function getMetaProperties(metaValue) {
  return metaValue.properties.reduce((accum, property) => {
    const propertyName = property.key.name;
    const meta = getMetaNode(property.value, property.key.name);

    return Object.assign({}, accum, { [propertyName]: meta });
  }, {});
}

module.exports = metaValue => {
  if (t.isStringLiteral(metaValue)) {
    if (metaValue.value !== 'exclude') {
      throw new Error(
        `Unsupported propTypesMeta value '${metaValue.value}'. ` +
          `Expected 'exclude'.`
      );
    }

    return metaValue.value;
  }

  return getMetaProperties(metaValue);
};
