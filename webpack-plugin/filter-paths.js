// Replaces backslashes with forward slashes so that there's no windows/unix path syntax confusion
const normalizePath = path =>
  typeof path === 'string' ? path.replace(/\\+/g, '/') : path;

// paths: array (string). Array of paths to filter
// match: array (string|RegExp). Array of patterns to compare with path
//    A path that matches any element in 'match' is included (unless it matches an 'exclude' pattern).
// exclude: array (string|RegExp). Array of patterns to compare with path
//    A path that matches any elemet in 'exclude' is excluded.

const filterPaths = (paths = [], matchPatterns = [], excludePatterns = []) => {
  return paths.filter(path => {
    return (
      path &&
      matchPatterns
        .map(normalizePath)
        .some(pattern => normalizePath(path).match(pattern)) &&
      excludePatterns
        .map(normalizePath)
        .every(pattern => !normalizePath(path).match(pattern))
    );
  });
};

module.exports = filterPaths;
