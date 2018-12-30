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
    const { argument, type } = propType;

    if (['shape', 'oneOf'].includes(type)) {
      const isRequired = propType.isRequired ? { isRequired: true } : {};
      const prop = { ...isRequired, hasClassDefinition: true, type: propName };

      return { ...accum, [propName]: prop };
    }

    if (type === 'arrayOf' && ['shape', 'oneOf'].includes(argument.type)) {
      const prop = {
        ...propType,
        argument: { type: arrayElementName(propName), hasClassDefinition: true }
      };

      return { ...accum, [propName]: prop };
    }

    return { ...accum, [propName]: propType };
  }, {});
};

const getSingleDefinition = (propName, propType, parent) => {
  const { argument, type } = propType;

  if (type === 'shape') {
    const properties = { ...propType, argument: flattenShapes(argument) };
    const definition = { name: propName, parent, properties };
    const childDefinitions = getNewDefinitions(argument, {
      name: propName,
      parent
    });

    return [definition, ...childDefinitions];
  }

  if (type === 'arrayOf' && ['shape', 'oneOf'].includes(argument.type)) {
    return getSingleDefinition(arrayElementName(propName), argument, parent);
  }

  if (type === 'oneOf') {
    return [{ name: propName, parent, properties: propType }];
  }

  return [];
};

function getNewDefinitions(propTypes, parent) {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    return [...accum, ...getSingleDefinition(propName, propType, parent)];
  }, []);
}

module.exports = function(propTypes, componentName) {
  // 'propTypes' is a string when 'A.propTypes = B.propTypes;'
  if (typeof propTypes === 'string') {
    return propTypes;
  }

  // Replace props that should have separate class definitions with references to the new definitions
  const componentClass = {
    name: componentName,
    parent: { name: componentName },
    properties: {
      type: 'shape',
      argument: flattenShapes(propTypes),
      isComponentClass: true
    }
  };

  // Create new definitions for props of type 'shape' and 'oneOf' or array of 'shape'
  const childClasses = getNewDefinitions(propTypes, { name: componentName });

  return [componentClass, ...childClasses];
};
