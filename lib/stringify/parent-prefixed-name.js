const capitalize = require('./capitalize');

const parentPrefixedName = (name, parent, accum = []) => {
  if (!parent.parent) {
    const prefixes = accum
      .map(prefix => capitalize(prefix) + '_')
      .reverse()
      .join('');
    return `${parent.name}_${prefixes}${capitalize(name)}`;
  }

  return parentPrefixedName(name, parent.parent, [...accum, parent.name]);
};

module.exports = parentPrefixedName;
