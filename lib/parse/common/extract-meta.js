const t = require('@babel/types');
const { get, match, otherwise, Pipe } = require('kompis');

const { throwError, throwIfNull } = require('../../utils/error-handling');
const metaTypes = require('../../meta-types');
const metaValues = Object.values(metaTypes);
const Node = require('../../node');

const validateString = str =>
  metaTypes[str]
    ? str
    : throwError(`expected one of [${metaValues}] but got '${str}'`);

// NOTE: Node factory not used here because 'exclude' is not a valid Node type
const makeNode = (type, ref) => (ref ? { type, ref } : { type });
const NodeWithChildren = type => children => Node({ type, children });

const getFirstElement = Pipe(
  get('elements[0]'),
  throwIfNull('missing value'),
  getMetaNode
);

function getMetaNode(node) {
  return match(
    [t.isStringLiteral, Pipe(get('value'), validateString, makeNode)],
    [t.isIdentifier, Pipe(get('name'), name => makeNode('ref', name))],
    [t.isObjectExpression, Pipe(getMetaProperties, NodeWithChildren('shape'))],
    [t.isArrayExpression, Pipe(getFirstElement, NodeWithChildren('arrayOf'))],
    [otherwise, () => throwError('unsupported type')]
  )(node);
}

function getMetaProperties(metaValue) {
  return metaValue.properties.reduce((accum, property) => {
    const { name } = property.key;

    try {
      return Object.assign({}, accum, { [name]: getMetaNode(property.value) });
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
