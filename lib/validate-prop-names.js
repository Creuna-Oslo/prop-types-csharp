module.exports = (propTypes, className) => {
  const nameCollision = Object.keys(propTypes).find(
    propName => propName.toLowerCase() === className.toLowerCase()
  );

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${nameCollision}'. Prop names must be different from component name.`
    );
  }
};
