const generateClass = require('../lib');

const { components } = require('../fixtures/source-code');

const code = `const Component = () => <div />;
Component.propTypes = AnotherComponent.propTypes;
export default Component;`;

console.log(
  generateClass({
    baseClass: 'ReactComponent',
    indent: 4,
    namespace: 'Namespace',
    sourceCode: code
  }).code
);
