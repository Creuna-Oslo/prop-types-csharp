const primitiveTypes = require('./primitive-types');

const validTypes = primitiveTypes.concat([
  'arrayOf',
  'objectOf',
  'oneOf',
  'shape',

  'ref' // Holds a type reference, usually to another component
]);

// Utility "factory" function that does validation on types
module.exports = function Node({ type, isRequired, children, parents, ref }) {
  if (!validTypes.includes(type)) {
    throw new Error(`Type '${type}' is not supported.`);
  }

  return Object.assign(
    { type },
    isRequired && { isRequired },
    children && { children },
    parents && { parents },
    ref && { ref }
  );
};
