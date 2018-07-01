const capitalize = require('./capitalize');

module.exports = function(string) {
  return string
    .split(/[^a-zA-Z\d]/g)
    .map(segment => capitalize(segment))
    .join('');
};
