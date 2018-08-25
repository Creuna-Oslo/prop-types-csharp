// - Replaces all line breaks with \n
// - Removes empty lines
// - Removes whitespace at the end of lines
// - Removes whitespace at the start of lines
module.exports = (string, removeIndentation = true) =>
  string
    .replace(/[\n\r]/g, '\n')
    .replace(/\s+$/gm, '')
    .replace(removeIndentation ? /^\s+/gm : '', '');
