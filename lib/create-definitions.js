const { getInnerNode, assignToInnerArray } = require('./utils/array-of');

// This function expects the component name as string, and an object representing the propTypes of a component.
// It returns an array of objects representing the classes to be generated
//  - Every prop of type 'oneOf' and 'shape' will get a class definition
//  - Props of type 'arrayOf' will get a class definition if 'children' is a 'shape'

// See the 'create-definitions' tests

const arrayElementName = name => `${name}Item`;
const hasShape = node => ['shape', 'oneOf'].includes(getInnerNode(node).type);

// Returns a propTypes object where 'shape' and 'oneOf' nodes are replaced by the name of the prop.
// Nested 'arrayOf' is kept nested, but the innermost non-arrayOf will be flattened
// Before: { a: { type: 'shape', children: { b: { type: 'string' } } } }
// After:  { a: { type: 'a', parents: ['Component'] } })
const flattenTypes = (propTypes, parents) => {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    // NOTE: 'parents' is not included if empty
    const parentsObj = parents ? { parents } : {};

    if (['shape', 'oneOf'].includes(propType.type)) {
      // NOTE: isRequired won't be added if falsy
      const isRequired = propType.isRequired ? { isRequired: true } : {};
      const prop = {
        ...isRequired,
        ...parentsObj,
        type: propName
      };

      return { ...accum, [propName]: prop };
    }

    if (propType.type === 'arrayOf' && hasShape(propType)) {
      const newNode = assignToInnerArray(propType, {
        children: {
          type: arrayElementName(propName),
          ...parentsObj
        }
      });
      return { ...accum, [propName]: newNode };
    }

    return { ...accum, [propName]: propType };
  }, {});
};

// Returns a definition object if the prop has a type with children, like shape, arrayOf, oneOf
const createSingleDefinition = (propName, propType, parents) => {
  const { children, type } = propType;

  if (type === 'shape') {
    const properties = {
      parents,
      ...propType,
      children: flattenTypes(children, parents.concat(propName))
    };
    const childDefinitions = createShallowDefinitions(
      children,
      parents.concat(propName)
    );

    return [{ name: propName, properties }, ...childDefinitions];
  }

  if (type === 'arrayOf' && hasShape(propType)) {
    return createSingleDefinition(
      arrayElementName(propName),
      getInnerNode(propType),
      parents
    );
  }

  if (type === 'oneOf') {
    return [{ name: propName, properties: { parents, ...propType } }];
  }

  return [];
};

// Creates a list of shallow definitions from the component shape and any prop child shapes/arrays
function createShallowDefinitions(propTypes, parents) {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    return [...accum, ...createSingleDefinition(propName, propType, parents)];
  }, []);
}

module.exports = className => propTypes => {
  // Replace props that should have separate class definitions with references to the new definitions
  const componentClass = {
    name: className,
    properties: {
      type: 'shape',
      children: flattenTypes(propTypes, [className])
    }
  };

  // Create new definitions for props of type 'shape' and 'oneOf' or array of 'shape'
  const childClasses = createShallowDefinitions(propTypes, [className]);

  return [componentClass, ...childClasses];
};
