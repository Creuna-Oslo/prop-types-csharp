const isEquivalent = require('./utils/is-equivalent-string');

module.exports = (className, propTypes) => {
  const nameCollision = Object.keys(propTypes).find(isEquivalent(className));

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${nameCollision}'. Prop names must be different from component name.`
    );
  }

  return propTypes;
};
