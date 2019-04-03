const test = require('ava');

const { generate } = require('../../../index');
const normalize = require('../../utils/_normalize-string');

const {
  classes,
  components
} = require('../../../fixtures/javascript/source-code');

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
  'Supports extending with own properties',
  template,
  `const Component = () => <div />;
  Component.propTypes = Object.assign({}, AnotherComponent.propTypes, { foo: PropTypes.string });
  export default Component;`,

  `${csharpImports}
  public class Component : AnotherComponent
  {
    public string Foo { get; set; }
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

test(
  'PropTypes.exact with component reference',
  template,
  `import Link from '../link';
  const Component = () => {};
  Component.propTypes = { a: PropTypes.exact(Link.propTypes) };
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public Link A { get; set; }
  }`
);

test(
  'Reference to property of other component',
  template,
  `import A from '../a';
  const Component = () => {};
  Component.propTypes = {
    simple: A.propTypes.c,
    list: PropTypes.arrayOf(A.propTypes.c)
  };
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public A_C Simple { get; set; }
    public IList<A_C> List { get; set; }
  }`
);

test(
  'Without propTypes literal and with exclude meta',
  template,
  `const Component = () => {};
  Component.propTypesMeta = "exclude";
  export default Component;`,
  undefined
);

test(
  'Mutation of propTypes',
  template,
  `const Component = () => {};
  Component.propTypes = { a: PropTypes.number };
  Component.propTypes.b = PropTypes.string;
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public int A { get; set; }
    public string B { get; set; }
  }`
);

test(
  'Nested shape',
  template,
  `import Link from '../link';
  const Component = () => {};
  Component.propTypes = { a: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.shape({ b: PropTypes.string })))) };
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public IList<IList<IList<Component_AItem>>> A { get; set; }
  }
  
  public class Component_AItem
  {
    public string B { get; set; }
  }`
);

test(
  'Supports objectOf',
  template,
  `const Component = () => {};
  Component.propTypes= {
    a: PropTypes.objectOf(PropTypes.string),
    b: PropTypes.objectOf(Link.propTypes),
    c: PropTypes.objectOf(PropTypes.exact({
      d: PropTypes.string
    }))
  };
  export default Component;`,
  `${csharpImports}
  public class Component
  {
    public Dictionary<string, string> A { get; set; }
    public Dictionary<string, Link> B { get; set; }
    public Dictionary<string, Component_C> C { get; set; }
  }
  
  public class Component_C
  {
    public string D { get; set; }
  }`
);
