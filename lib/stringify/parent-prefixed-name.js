const { concatRight, join, reduce, Pipe } = require('kompis');

const capitalize = require('./capitalize');

const makeSegment = str => capitalize(str) + '_';
const prefixString = Pipe(reduce(concatRight, [], makeSegment), join(''));

const parentPrefixedName = (name, parent, accum = []) =>
  parent.parent
    ? parentPrefixedName(name, parent.parent, [...accum, parent.name])
    : `${parent.name}_${prefixString(accum)}${capitalize(name)}`;

module.exports = parentPrefixedName;
