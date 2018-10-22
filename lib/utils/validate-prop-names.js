module.exports = (propTypes, componentName) => {
  const nameCollision = Object.keys(propTypes).find(
    propName => propName.toLocaleLowerCase() === componentName.toLowerCase()
  );

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${nameCollision}'. Prop names must be different from component name.`
    );
  }
};
