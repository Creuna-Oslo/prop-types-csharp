const { get } = require('kompis');

module.exports = function(string) {
  return get('[0]', '')(string).toUpperCase() + string.slice(1);
};
