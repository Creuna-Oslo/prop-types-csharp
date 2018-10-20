const t = require('@babel/types');

module.exports = (propTypes, componentName) => {
  const nameCollision = Object.keys(propTypes).find(
    propName => propName.toLocaleLowerCase() === componentName.toLowerCase()
  );

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${
        nameCollision.key.name
      }'. Prop names must be different from component name.`
    );
  }
};
