const t = require('@babel/types');

const { get, match, otherwise, Pipe } = require('kompis');

const { throwError, throwIfNull } = require('../../utils/error-handling');
const metaTypes = require('../../meta-types');
const metaValues = Object.values(metaTypes);

const validateString = str =>
  metaTypes[str]
    ? str
    : throwError(`expected one of [${metaValues}] but got '${str}'`);

const validateArray = throwIfNull('missing value');

const metaNode = type => ({ type });
const metaNodeWithArg = type => argument => ({ type, argument });

const getMetaNode = node =>
  match(
    [t.isStringLiteral, Pipe(get('value'), validateString, metaNode)],
    [t.isIdentifier, Pipe(get('name'), metaNode)],
    [t.isObjectExpression, Pipe(getMetaProperties, metaNodeWithArg('shape'))],
    [
      t.isArrayExpression,
      Pipe(
        get(['elements', 0]),
        validateArray,
        getMetaNode,
        metaNodeWithArg('arrayOf')
      )
    ],
    [otherwise, () => throwError('unsupported type')]
  )(node);

function getMetaProperties(metaValue) {
  return metaValue.properties.reduce((accum, property) => {
    const { name } = property.key;

    try {
      const meta = getMetaNode(property.value);
      return Object.assign({}, accum, { [name]: meta });
    } catch (error) {
      throw new Error(`Invalid meta type for '${name}': ${error.message}`);
    }
  }, {});
}

const unsupportedMetaError = value =>
  `Unsupported propTypesMeta value '${value}'. Expected 'exclude'.`;

module.exports = meta => {
  if (t.isStringLiteral(meta)) {
    return meta.value === 'exclude'
      ? meta.value
      : throwError(unsupportedMetaError(meta.value));
  }

  return getMetaProperties(meta);
};
