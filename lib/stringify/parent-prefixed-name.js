const { add, reduce, Pipe } = require('kompis');

const capitalize = require('./capitalize');

const prefixString = Pipe(reduce(add, '', Pipe(capitalize, add('_'))));

const parentPrefixedName = (name, parents = []) =>
  `${prefixString(parents)}${capitalize(name)}`;

module.exports = parentPrefixedName;
