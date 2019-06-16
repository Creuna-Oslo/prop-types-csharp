// Creates a dot-notation string, skipping any undefined values
module.exports = strings => strings.filter(string => string).join('.');
