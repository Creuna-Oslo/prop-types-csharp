const isObjectMethod = require('./is-object-method');
const Node = require('../../node');
const parseObjectMethod = require('./parse-object-method');

const isShape = type => ['shape', 'exact'].includes(type);

const validTypes = ['arrayOf', 'exact', 'oneOf', 'objectOf', 'shape'];
const typesToStrip = ['instanceOf'];

module.exports = (meta, parseType) => node => {
  const { callee } = node;
  const [argument] = node.arguments;

  if (typesToStrip.includes(callee.name)) return;

  // NOTE: argument is an object expression or a member expression
  if (isShape(callee.name)) return parseType(argument, meta.children);

  // Object.keys, Object.values. Returns an array
  if (isObjectMethod(node)) return parseObjectMethod(node);

  if (validTypes.includes(callee.name)) {
    // NOTE: children might be undefined because of 'exclude' meta
    const children = parseType(argument, meta.children);
    return children && Node({ type: callee.name, children });
  }

  throw new Error(`Invalid function call '${callee.name}'`);
};
