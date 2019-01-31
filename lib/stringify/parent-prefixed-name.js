const { add, reduce, Pipe } = require('kompis');

const capitalize = require('./capitalize');

const prefixString = Pipe(reduce(add, '', Pipe(capitalize, add('_'))));

const parentPrefixedName = (name, parent, accum = []) =>
  parent.parent
    ? parentPrefixedName(name, parent.parent, [parent.name, ...accum])
    : `${parent.name}_${prefixString(accum)}${capitalize(name)}`;

module.exports = parentPrefixedName;
