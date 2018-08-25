const capitalize = require('./capitalize');

module.exports = function(string) {
  return string
    .split(/[^a-zA-Z\d]/g)
    .filter(segment => segment) // Removes empty string segments
    .map(segment => capitalize(segment))
    .join('');
};
