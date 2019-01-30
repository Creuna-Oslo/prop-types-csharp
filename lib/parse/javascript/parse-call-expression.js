const t = require('@babel/types');

const parseObjectMethod = require('./parse-object-method');

module.exports = (meta, parseType) => path => {
  const {
    callee,
    arguments: [argument]
  } = path;

  // Handle component references in 'shape'
  if (
    ['shape', 'exact'].includes(callee.name) &&
    t.isMemberExpression(argument) &&
    t.isIdentifier(argument.property, { name: 'propTypes' })
  ) {
    return parseType(argument.object, meta);
  }

  if (meta.type === 'exclude') {
    return;
  }

  // 'instanceOf' is included here because it is automatically stripped in 'transform-prop-types.js' and should not throw an error
  if (
    ['arrayOf', 'exact', 'instanceOf', 'oneOf', 'shape'].includes(callee.name)
  ) {
    return {
      type: callee.name,
      argument: parseType(argument, meta)
    };
  }

  // Object.keys, Object.values
  if (
    t.isMemberExpression(callee) &&
    t.isIdentifier(callee.object, { name: 'Object' })
  ) {
    return parseObjectMethod(path);
  }

  throw new Error(`Invalid function call '${callee.name}'`);
};
