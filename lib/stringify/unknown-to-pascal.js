const { add, Pipe, reduce, split } = require('kompis');

const capitalize = require('./capitalize');

module.exports = (str = '') =>
  Pipe(split(/[^a-zA-Z\d]/g), reduce(add, '', capitalize, v => !!v))(str);
