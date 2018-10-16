const fs = require('fs');
const path = require('path');
const test = require('ava');

const packageJson = require('../package.json');
const { version } = packageJson;

test('Has changelog entry for current version', t => {
  t.plan(2);

  const changelog = fs.readFileSync(
    path.resolve(__dirname, '..', 'CHANGELOG.md'),
    'utf8'
  );

  t.is(changelog.length > 0, true);
  t.is(changelog.includes(`# ${version}`), true);
});
