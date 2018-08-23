const fs = require('fs');
const path = require('path');
const test = require('ava');

const generateClass = require('../source/generate-class');

const funcComponentPath = path.join(
  __dirname,
  '../fixtures/func-component.jsx'
);
const funcComponentSource = fs.readFileSync(funcComponentPath, 'utf-8');

const classComponentPath = path.join(
  __dirname,
  '../fixtures/class-component.jsx'
);
const classComponentSource = fs.readFileSync(classComponentPath, 'utf-8');

test('Functional component', t => {
  const transformedSource = generateClass({
    sourceCode: funcComponentSource
  });
  t.snapshot(transformedSource.code);
});

test('Class component', t => {
  const transformedSource = generateClass({
    sourceCode: classComponentSource
  });
  t.snapshot(transformedSource.code);
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
