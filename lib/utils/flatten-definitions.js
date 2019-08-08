const { getInnerNode, assignToInnerArray } = require('./array-of');
const Node = require('../node');

const hasShape = node => ['shape', 'oneOf'].includes(getInnerNode(node).type);

const flattenType = (propName, propType, parents) => {
  if (['shape', 'oneOf'].includes(propType.type)) {
    const { isRequired } = propType;
    return Node({ type: 'ref', isRequired, parents, ref: propName });
  }

  if (propType.type === 'objectOf') {
    return Node({
      ...propType,
      children: flattenType(propName, propType.children, parents)
    });
  }

  if (propType.type === 'arrayOf' && hasShape(propType)) {
    return Node(
      assignToInnerArray(propType, {
        children: Node({ type: 'ref', ref: propName, parents })
      })
    );
  }

  return propType;
};

// Returns a propTypes object where 'shape' and 'oneOf' nodes are replaced by the name of the prop.
// Nested 'arrayOf' is kept nested, but the innermost non-arrayOf will be flattened
// Before: { a: { type: 'shape', children: { b: { type: 'string' } } } }
// After:  { a: { type: 'ref', ref: 'a', parents: ['Component'] } })
const flattenTypes = (propTypes, parents) =>
  Object.entries(propTypes).reduce(
    (accum, [name, type]) => ({
      ...accum,
      [name]: flattenType(name, type, parents)
    }),
    {}
  );

// Returns a definition object if the prop has a type with children, like shape, arrayOf, oneOf
const createSingleDefinition = (propName, propType, parents) => {
  const { children, type } = propType;

  if (type === 'shape') {
    const properties = Node({
      parents,
      ...propType,
      children: flattenTypes(children, parents.concat(propName))
    });
    const childDefinitions = createShallowDefinitions(
      children,
      parents.concat(propName)
    );

    return [{ name: propName, properties }, ...childDefinitions];
  }

  if (type === 'arrayOf' && hasShape(propType)) {
    return createSingleDefinition(propName, getInnerNode(propType), parents);
  }

  return type === 'objectOf'
    ? createSingleDefinition(propName, propType.children, parents)
    : type === 'oneOf'
    ? [{ name: propName, properties: { parents, ...propType } }]
    : [];
};

// Creates a list of shallow definitions from the component shape and any prop child shapes/arrays
function createShallowDefinitions(propTypes, parents) {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    return [...accum, ...createSingleDefinition(propName, propType, parents)];
  }, []);
}

// This function expects the component name as string, and an object representing the propTypes of a component.
// It returns an array of objects representing the classes to be generated
//  - Every prop of type 'oneOf' and 'shape' will get a class definition
//  - Props of type 'arrayOf' will get a class definition if 'children' is a 'shape'

// See the 'flatten-definitions' tests
module.exports = (propTypes, className) => {
  // Replace props that should have separate class definitions with references to the new definitions
  const componentClass = {
    name: className,
    properties: Node({
      type: 'shape',
      children: flattenTypes(propTypes, [className])
    })
  };

  // Create new definitions for props of type 'shape' and 'oneOf' or array of 'shape'
  const childClasses = createShallowDefinitions(propTypes, [className]);

  return [componentClass, ...childClasses];
};
