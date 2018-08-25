const test = require('ava');
const path = require('path');

const generateClasses = require('../../webpack-plugin/generate-classes');

test('Generates classes', t => {
  t.plan(2);

  const { classes, error } = generateClasses({
    modulePaths: [
      path.join(__dirname, '../../fixtures/link.jsx'),
      path.join(__dirname, '../../fixtures/class-component.jsx'),
      path.join(__dirname, '../../fixtures/func-component.jsx')
    ]
  });

  t.is(error, null);
  t.is(classes.filter(({ error }) => !error).length, 3);
});

test('Returns error on duplicate component names', t => {
  const { error } = generateClasses({
    modulePaths: [
      path.join(__dirname, '../../fixtures/link.jsx'),
      path.join(__dirname, '../../fixtures/nested-component/link.jsx')
    ]
  });

  t.not(error, null);
});
