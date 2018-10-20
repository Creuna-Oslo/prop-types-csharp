// This function expects the component name as string, and an object representing the propTypes of a component.
// It returns an array of objects representing the classes to be generated
//  - Every prop of type 'oneOf' and 'shape' will get a class definition
//  - Props of type 'arrayOf' will get a class definition if the argument is a 'shape'

// See the 'create-definitions' tests

const arrayElementName = name => `${name}Item`;

const flattenShapes = propTypes => {
  return Object.entries(propTypes).reduce((accum, [propName, propType]) => {
    if (['shape', 'oneOf'].includes(propType.type)) {
      const isRequired = propType.isRequired ? { isRequired: true } : {};
      return {
        ...accum,
        [propName]: {
          ...isRequired,
          hasClassDefinition: true,
          type: propName
        }
      };
    }

    if (propType.type === 'arrayOf' && propType.argument.type === 'shape') {
      return {
        ...accum,
        [propName]: {
          ...propType,
          argument: {
            type: arrayElementName(propName),
            hasClassDefinition: true
          }
        }
      };
    }

    return { ...accum, [propName]: propType };
  }, {});
};

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

  return [
    {
      name: propName,
      parent,
      properties: { ...shape, argument: flattenShapes(shape.argument) }
    },
    ...childDefinitions
  ];
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
