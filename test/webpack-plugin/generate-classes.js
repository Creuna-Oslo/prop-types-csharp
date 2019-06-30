const test = require('ava');
const path = require('path');

const generateClasses = require('../../webpack-plugin/generate-classes');

test('Generates classes', t => {
  t.plan(2);

  const { classes, error } = generateClasses([
    path.join(__dirname, '../../fixtures/javascript/class-component.jsx'),
    path.join(__dirname, '../../fixtures/javascript/func-component.jsx')
  ]);

  t.is(null, error);
  t.is(classes.filter(({ error }) => !error).length, 2);
});

test('Returns error on duplicate component names', t => {
  const component1Path = path.resolve(
    __dirname,
    '../../fixtures/javascript/func-component.jsx'
  );
  const component2Path = path.resolve(
    __dirname,
    '../../fixtures/javascript/nested-component/func-component.jsx'
  );

  const { error } = generateClasses([component1Path, component2Path]);

  const expectedError = `Found duplicate component names in:
FunctionalComponent (${component1Path})
FunctionalComponent (${component2Path})`;

  t.is(expectedError, error);
});

test('Returns class generation error', t => {
  const modulePath = path.resolve(
    __dirname,
    '../../fixtures/javascript/error-component.jsx'
  );
  const { classes } = generateClasses([modulePath]);
  const expectedError = `
${modulePath}
Invalid type for prop 'a' ('object').
Replace with 'PropTypes.shape' or provide a meta type\n`;

  t.is(expectedError, classes[0].error);
});
