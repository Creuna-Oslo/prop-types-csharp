const fs = require('fs');
const test = require('ava');
const path = require('path');

const { generate, parsers } = require('../../../index');
const normalize = require('../../utils/_normalize-string');

const rootPath = path.resolve(__dirname, '..', '..', '..');
const fixturesPath = path.join(rootPath, 'fixtures', 'typescript');

const componentContent = fs.readFileSync(
  path.join(fixturesPath, 'class-component.tsx'),
  'utf8'
);
const classContent = fs.readFileSync(
  path.join(fixturesPath, 'classes', 'class-component.cs'),
  'utf8'
);

const template = (t, sourceCode, expected, options) => {
  const transformedSource = generate(
    Object.assign({}, options, { sourceCode, parser: parsers.typescript })
  );
  t.is(normalize(expected), normalize(transformedSource.code));
};

const csharpImports = `using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;`;

test('Fixture component', template, componentContent, classContent);

test(
  'Empty component',
  template,
  `const Component = (props: {}) => {}; export default Component;`,

  `${csharpImports}
  public class Component
  {
  }
`
);

test(
  'With type definition',
  template,
  `type A = { b?: string };
  export const C = (p: A) => null;`,
  `${csharpImports}
  public class A
  {
    public string B { get; set; }
  }
  `
);

test(
  'With interface definition',
  template,
  `interface A { b?: string }
  export const C = (p: A) => null;`,
  `${csharpImports}
  public class A
  {
    public string B { get; set; }
  }`
);

test(
  'Type literal',
  template,
  `export class C extends React.Component<{ b?: string }> {}`,
  `${csharpImports}
  public class C
  {
    public string B { get; set; }
  }`
);

test('Throws on multiple exports', t => {
  const sourceCode = `
  export const Component = (props: {}) => null,
  A = true;`;
  const error = t.throws(() => {
    generate({ sourceCode, parser: parsers.typescript });
  });

  t.is(
    "Couldn't get component name because of multiple exports.",
    error.message
  );
});

test('Throws on name collisions', t => {
  const sourceCode = `
  const Component = (props: { component: string }) => <div>{props.component}</div>;
  export default Component;`;
  const error = t.throws(() => {
    generate({ sourceCode, parser: parsers.typescript });
  });

  t.is(
    "Illegal prop name 'component'. Prop names must be different from component name.",
    error.message
  );
});

test(
  'Strips client-only types',
  template,
  `
  type ComponentProps = {
    a: () => void;
    b: JSX.Element;
  };
  const Component = (props: ComponentProps) => <div></div>;
  export default Component;`,

  `${csharpImports}
  public class ComponentProps
  {
  }`
);

test(
  'Imported type reference',
  template,
  `import { AnotherComponent } from './another-component';
  const Component = (props: AnotherComponent) => <div />;
  export default Component;`,

  `${csharpImports}
  public class Component : AnotherComponent
  {
  }`
);

test(
  'Excluded component',
  template,
  `const Component = (props: {}) => {};
  Component.propTypesMeta = "exclude";
  export default Component;`,
  undefined
);
