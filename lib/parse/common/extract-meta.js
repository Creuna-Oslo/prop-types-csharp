const t = require('@babel/types');

const { get, match, otherwise, Pipe } = require('kompis');

const metaTypes = require('../../meta-types');

const validMetaTypes = Object.values(metaTypes);
const invalidMetaTypeError = (value, propertyName) =>
  new Error(
    `Invalid meta type '${value}' for '${propertyName}'. Expected one of [${validMetaTypes}]`
  );

const validateString = propName => node => {
  if (!metaTypes[node.value]) {
    throw invalidMetaTypeError(node.value, propName);
  }
  return node;
};

const validateArray = propertyName => value => {
  if (!value) {
    throw new Error(`Missing value in meta type for '${propertyName}'`);
  }
  return value;
};

const metaNode = type => ({ type });
const metaNodeWithArgs = type => argument => ({ type, argument });

const handleUnsupported = propName => () => {
  throw new Error(`Unsupported meta type for '${propName}'`);
};

const getMetaNode = propName => node =>
  match(
    [t.isStringLiteral, Pipe(validateString(propName), get('value'), metaNode)],
    [t.isIdentifier, Pipe(get('name'), metaNode)],
    [t.isObjectExpression, Pipe(getMetaProperties, metaNodeWithArgs('shape'))],
    [
      t.isArrayExpression,
      Pipe(
        get(['elements', 0]),
        validateArray(propName),
        getMetaNode(propName),
        metaNodeWithArgs('arrayOf')
      )
    ],
    [otherwise, handleUnsupported(propName)]
  )(node);

function getMetaProperties(metaValue) {
  return metaValue.properties.reduce((accum, property) => {
    const propertyName = property.key.name;
    const meta = getMetaNode(property.key.name)(property.value);

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
