const test = require('ava');

const generateClass = require('../../lib');
const normalize = require('../utils/_normalize-string');

const { classes, components } = require('../../fixtures/source-code');

test('Functional component', t => {
  const transformedSource = generateClass({
    sourceCode: components.funcComponent
  });
  t.is(normalize(classes.funcComponent), normalize(transformedSource.code));
});

test('Class component', t => {
  const transformedSource = generateClass({
    sourceCode: components.classComponent
  });
  t.is(normalize(classes.classComponent), normalize(transformedSource.code));
});

test('Throws on name collisions', t => {
  const sourceCode = `
  import PropTypes from 'prop-types';
  const Component = ({ component }) => <div>{component}</div>;
  Component.propTypes = { component: PropTypes.string };
  export default Component;`;
  t.throws(() => {
    generateClass({ sourceCode });
  });
});
