const fs = require('fs');
const path = require('path');

const { generate, parsers } = require('../index');

const sourceCode = fs.readFileSync(
  path.resolve(__dirname, '..', 'fixtures', 'typescript', 'component.tsx'),
  'utf8'
);

const output = generate({ sourceCode, parser: parsers.typescript });

console.log(output.code);
