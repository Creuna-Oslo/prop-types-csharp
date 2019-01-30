const { exists } = require('kompis');

const throwError = message => {
  throw new Error(message);
};

const throwIfNull = message => value =>
  exists(value) ? value : throwError(message);

module.exports = {
  throwError,
  throwIfNull
};
