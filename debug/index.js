const generateClass = require('../lib');

const { components } = require('../fixtures/source-code');

console.log(
  generateClass({
    baseClass: 'ReactComponent',
    indent: 4,
    namespace: 'Namespace',
    sourceCode: components.funcComponent
  }).code
);
