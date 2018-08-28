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

test('Respects meta with illegal types', t => {
  const sourceCode = `
  import PropTypes from 'prop-types';
  import something from './something';
  const Component = ({ a, b, c }) => <div></div>;
  Component.propTypes = {
    a: someFunc(),
    b: PropTypes.oneOf(Object.keys(something)),
    c: PropTypes.object,
    d: PropTypes.array
  };
  Component.propTypesMeta = {
    a: 'exclude',
    b: 'exclude',
    c: 'exclude',
    d: 'exclude',
  };
  export default Component;`;

  const expected = `
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
public class Component
{
}
  `;

  const transformedSource = generateClass({ sourceCode });
  t.is(normalize(expected), normalize(transformedSource.code));
});
