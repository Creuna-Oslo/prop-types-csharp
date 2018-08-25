const test = require('ava');

const generateClass = require('../../lib');
const normalize = require('../utils/_normalize-string');

const { classes, components } = require('../../fixtures/source-code');

test('Functional component', t => {
  const transformedSource = generateClass({
    sourceCode: components.funcComponent
  });
  t.is(normalize(transformedSource.code), normalize(classes.funcComponent));
});

test('Class component', t => {
  const transformedSource = generateClass({
    sourceCode: components.classComponent
  });
  t.is(normalize(transformedSource.code), normalize(classes.classComponent));
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
