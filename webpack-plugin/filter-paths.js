const { isString, mapIf, not, or, replace } = require('kompis');

// Replaces backslashes with forward slashes so that there's no windows/unix path syntax confusion
const normalize = mapIf(isString, replace(/\\+/g, '/'), or(''));

// paths: array (string). Array of paths to filter
// match: array (string|RegExp). Array of patterns to compare with path
//    A path that matches any element in 'match' is included (unless it matches an 'exclude' pattern).
// exclude: array (string|RegExp). Array of patterns to compare with path
//    A path that matches any elemet in 'exclude' is excluded.

const matches = path => pattern => normalize(path).match(normalize(pattern));
const doesNotMatch = path => not(matches(path));

const filterPaths = (paths = [], matchPatterns = [], excludePatterns = []) => {
  return paths.filter(
    path =>
      matchPatterns.some(matches(path)) &&
      excludePatterns.every(doesNotMatch(path))
  );
};

module.exports = filterPaths;
