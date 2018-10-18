module.exports = (string = '', numberOfSpaces = 2) => {
  const lines = string.split('\n');
  const baseIndent = ' '.repeat(numberOfSpaces);

  const { indentedLines } = lines.reduce(
    ({ indentationLevel, indentedLines }, line) => {
      let newIndentationLevel = indentationLevel;

      line.includes('}') && newIndentationLevel--;
      line.includes('{') && newIndentationLevel++;

      // Lines with a '}' should have the new level applied for the current line. Lines with '{' only affect subsequent lines.
      const indent = baseIndent.repeat(
        line.includes('}') ? newIndentationLevel : indentationLevel
      );

      return {
        indentationLevel: newIndentationLevel,
        indentedLines: indentedLines.concat(indent + line)
      };
    },
    { indentationLevel: 0, indentedLines: [] }
  );

  return indentedLines.join('\n');
};
