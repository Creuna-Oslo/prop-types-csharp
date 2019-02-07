const isEquivalent = require('./utils/is-equivalent-string');

module.exports = (propTypes, className) => {
  const nameCollision = Object.keys(propTypes).find(isEquivalent(className));

  if (nameCollision) {
    throw new Error(
      `Illegal prop name '${nameCollision}'. Prop names must be different from component name.`
    );
  }
};
