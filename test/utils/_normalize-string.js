// Replaces all line breaks with \n, removes empty lines and whitespace at the end of lines
module.exports = string =>
  string.replace(/[\n\r]/g, '\n').replace(/[\s]$/gm, '');
