const test = require('ava');

const indentBraces = require('../../../lib/stringify/indent-braces');

test('Adds indentation', t => {
  const string = `
{
{
{
hello
}
}
}
`;
  const expected = `
{
    {
        {
            hello
        }
    }
}
`;
  const indentedString = indentBraces(string, 4);

  t.is(expected, indentedString);
});

test("Doesn't crash when parameters are missing", t => {
  t.notThrows(() => {
    indentBraces();
  });
});
