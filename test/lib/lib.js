const test = require('ava');

const { generate } = require('../../index');
const normalize = require('../utils/_normalize-string');

const { classes, components } = require('../../fixtures/source-code');

const template = (t, input, expected, options) => {
  const transformedSource = generate(
    Object.assign({}, options, { sourceCode: input })
  );
  t.is(normalize(expected), normalize(transformedSource.code));
};

const csharpImports = `using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;`;

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

  `${csharpImports}
  public class Component
  {
  }
`
);

test(
  'Bad propTypes value',
  template,
  `const Component = () => {}; Component.propTypes = false; export default Component;`,
  undefined
);

test('Throws on name collisions', t => {
  const sourceCode = `
  import PropTypes from 'prop-types';
  const Component = ({ component }) => <div>{component}</div>;
  Component.propTypes = { component: PropTypes.string };
  export default Component;`;
  const error = t.throws(() => {
    generate({ sourceCode });
  });

  t.is(
    "Illegal prop name 'component'. Prop names must be different from component name.",
    error.message
  );
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

  `${csharpImports}
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

  `${csharpImports}
  public class Component : BaseClass
  {
  }`,
  {
    baseClass: 'BaseClass'
  }
);

test(
  'Extends when inheriting propTypes',
  template,
  `const Component = () => <div />;
  Component.propTypes = AnotherComponent.propTypes;
  export default Component;`,

  `${csharpImports}
  public class Component : AnotherComponent
  {
  }`
);

test(
  'Extending overrides base class',
  template,
  `const Component = () => <div />;
  Component.propTypes = AnotherComponent.propTypes;
  export default Component;`,

  `${csharpImports}
  public class Component : AnotherComponent
  {
  }`,
  {
    baseClass: 'BaseClass'
  }
);

test(
  'Non-propType reference',
  template,
  `const Component = () => {}; Component.propTypes = object.property; export default Component;`,
  undefined
);

test(
  'Excluded component',
  template,
  `const Component = () => {};
  Component.propTypes = {};
  Component.propTypesMeta = "exclude";
  export default Component;`,
  undefined
);

test(
  'String meta types',
  template,
  `const Component = () => {};
  Component.propTypes = {
    a: PropTypes.number,
    b: PropTypes.number,
    c: PropTypes.number,
    d: PropTypes.number,
    e: PropTypes.number,
    f: PropTypes.number
  };
  Component.propTypesMeta = {
    a: 'int',
    b: 'float',
    c: 'double',
    d: 'int?',
    e: 'float?',
    f: 'double?'
  };
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public int A { get; set; }
    public float B { get; set; }
    public double C { get; set; }
    public int? D { get; set; }
    public float? E { get; set; }
    public double? F { get; set; }
  }`
);
