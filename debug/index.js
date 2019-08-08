const generateClass = require('../lib');

const { components } = require('../fixtures/javascript/source-code');

console.log(
  generateClass(components.funcComponent, {
    baseClass: 'ReactComponent',
    indent: 4,
    namespace: 'Namespace'
  }).code
);
