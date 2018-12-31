module.exports = {
  generate: require('./lib'),
  parsers: {
    javascript: require('./lib/parse/javascript'),
    typescript: require('./lib/parse/typescript')
  }
};
