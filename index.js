module.exports = {
  compile: require('./lib'),
  generators: {
    csharp: require('./lib/stringify/csharp'),
    kotlin: require('./lib/stringify/kotlin')
  },
  parsers: {
    javascript: require('./lib/parse/javascript'),
    typescript: require('./lib/parse/typescript')
  }
};
