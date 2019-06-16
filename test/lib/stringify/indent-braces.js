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

test('Supports other symbol types', t => {
  const string = `
{
{
function() {
return null;
}
}
(
{
}
)
}`;
  const expected = `
{
  {
    function() {
      return null;
    }
  }
  (
    {
    }
  )
}`;
  const indentedString = indentBraces(string, 2, ['{', '('], ['}', ')']);
  t.is(expected, indentedString);
});

test("Doesn't crash when parameters are missing", t => {
  t.notThrows(() => {
    indentBraces();
  });
});
