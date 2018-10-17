const capitalize = require('../utils/capitalize');
const isIdentifierArray = require('../utils/is-identifier-array');

// This function expects the component name as string, and an object representing the propTypes of a component.
// It returns an array of objects representing the classes to be generated
//  - Every prop of type 'oneOf' and 'shape' will get a class definition
//  - Props of type 'arrayOf' will get a class definition if the argument is a 'shape'

//  Basically, turning this:
//    Component = {
//      propA: { a: string },
//      propB: [{ b: string }],
//      propC: [ 1, 2 ],
//    };

//  Into this:
//    Component = {
//      propA: PropA,
//      propB: [PropB],
//      propC: PropC
//    };
//    PropA = { a: string };
//    PropB = { b: string };
//    PropC = [ 1, 2 ];

const arrayElementName = name => `${name}Item`;

module.exports = function(propTypes) {
  // Replace props that should have separate class definitions with references to the new definitions
  const componentProperties = Object.entries(propTypes).reduce(
    (accum, [propName, propType]) => {
      if (['shape', 'oneOf'].includes(propType.type)) {
        return {
          ...accum,
          [propName]: { isNewDefinition: true, type: propName }
        };
      }

      if (propType.type === 'arrayOf' && propType.argument.type === 'shape') {
        return {
          ...accum,
          [propName]: {
            ...propType,
            argument: {
              type: arrayElementName(propName),
              isNewDefinition: true
            }
          }
        };
      }

      return { ...accum, [propName]: propType };
    },
    {}
  );

  const componentClass = { type: 'shape', argument: componentProperties };

  // Create object consisting only of props of type 'shape' and 'oneOf' or array of 'shape'
  const childClasses = Object.entries(propTypes).reduce(
    (accum, [propName, propType]) => {
      if (propType.type === 'arrayOf' && propType.argument.type === 'shape') {
        return { ...accum, [arrayElementName(propName)]: propType.argument };
      }

      if (['shape', 'oneOf'].includes(propType.type)) {
        return { ...accum, [propName]: propType };
      }

      return accum;
    },
    {}
  );

  return { componentClass, childClasses };
};
