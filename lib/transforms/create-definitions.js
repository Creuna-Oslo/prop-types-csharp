// This function expects the component name as string, and an object representing the propTypes of a component.
// It returns an array of objects representing the classes to be generated
//  - Every prop of type 'oneOf' and 'shape' will get a class definition
//  - Props of type 'arrayOf' will get a class definition if the argument is a 'shape'

// See the 'create-definitions' tests

const arrayElementName = name => `${name}Item`;

// Returns a propTypes object where 'shape' and 'oneOf' nodes are replaced by the name of the prop
// Before: { a: { type: 'shape', argument: { b: { type: 'string' } } } }
// After:  { a: { type: 'a', hasClassDefinition: true } })
const flattenShapes = propTypes => {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    if (['shape', 'oneOf'].includes(propType.type)) {
      const isRequired = propType.isRequired ? { isRequired: true } : {};
      const prop = { ...isRequired, hasClassDefinition: true, type: propName };

      return { ...accum, [propName]: prop };
    }

    if (propType.type === 'arrayOf' && propType.argument.type === 'shape') {
      const prop = {
        ...propType,
        argument: { type: arrayElementName(propName), hasClassDefinition: true }
      };

      return { ...accum, [propName]: prop };
    }

    return { ...accum, [propName]: propType };
  }, {});
};

// Given a 'shape' object with nested shapes, returns an array of 'shape' objects without nesting. References to parent shapes are kept in the 'parent' property
const unwrapShapes = (propName, shape, parent) => {
  const childDefinitions = Object.entries(shape.argument).reduce(
    (accum, [name, propType]) => {
      if (propType.type !== 'shape') {
        return accum;
      }

      const definitions = unwrapShapes(name, propType, {
        name: propName,
        parent
      });

      return [...accum, ...definitions];
    },
    []
  );

  const properties = { ...shape, argument: flattenShapes(shape.argument) };

  return [{ name: propName, parent, properties }, ...childDefinitions];
};

module.exports = function(propTypes, componentName) {
  // 'propTypes' is a string when 'A.propTypes = B.propTypes;'
  if (typeof propTypes === 'string') {
    return propTypes;
  }

  // Replace props that should have separate class definitions with references to the new definitions
  const componentProperties = flattenShapes(propTypes);

  const componentClass = {
    name: componentName,
    parent: { name: componentName },
    properties: {
      type: 'shape',
      argument: componentProperties,
      isComponentClass: true
    }
  };

  // Create new definitions for props of type 'shape' and 'oneOf' or array of 'shape'
  const childClasses = Object.entries(propTypes).reduce(
    (accum, [propName, propType]) => {
      const { argument, type } = propType;
      const parent = { name: componentName };

      if (type === 'shape') {
        return [...accum, ...unwrapShapes(propName, propType, parent)];
      }

      if (type === 'arrayOf' && argument.type === 'shape') {
        return [
          ...accum,
          {
            name: arrayElementName(propName),
            parent,
            properties: { ...argument }
          }
        ];
      }

      if (type === 'oneOf') {
        return [...accum, { name: propName, parent, properties: propType }];
      }

      return accum;
    },
    []
  );

  return [componentClass, ...childClasses];
};
