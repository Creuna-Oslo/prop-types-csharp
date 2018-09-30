const test = require('ava');

const generateClass = require('../../lib');
const normalize = require('../utils/_normalize-string');

const { classes, components } = require('../../fixtures/source-code');

const template = (t, input, expected, options) => {
  const transformedSource = generateClass(
    Object.assign({}, options, { sourceCode: input })
  );
  t.is(normalize(expected), normalize(transformedSource.code));
};

test(
  'Functional component',
  template,
  components.funcComponent,
  classes.funcComponent
);

test(
  'Class component',
  template,
  components.classComponent,
  classes.classComponent
);

test(
  'Empty component',
  template,
  `const Component = () => {}; Component.propTypes = {}; export default Component;`,

  `using System.Collections.Generic;
  using System.ComponentModel.DataAnnotations;
  using System.Runtime.Serialization;

  public class Component
  {
  }
`
);

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

test(
  'Respects meta with illegal types',
  template,
  `
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
  export default Component;`,

  `using System.Collections.Generic;
  using System.ComponentModel.DataAnnotations;
  using System.Runtime.Serialization;
  public class Component
  {
  }`
);

test(
  'Adds baseclass',
  template,
  `import PropTypes from 'prop-types';
  const Component = ({ a }) => <div></div>;
  Component.propTypes = {};
  export default Component;`,

  `using System.Collections.Generic;
  using System.ComponentModel.DataAnnotations;
  using System.Runtime.Serialization;
  public class Component : BaseClass
  {
  }`,
  {
    baseClass: 'BaseClass'
  }
);
